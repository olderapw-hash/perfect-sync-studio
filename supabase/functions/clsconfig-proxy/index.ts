// Edge Function: clsconfig-proxy
// Proxies requests to the external PW API so the secret is never exposed to the browser.
// Routes:
//   GET  /clsconfig  -> calls `${PW_API_BASE_URL}/apicls/api_cls.php?action=getClsconfig`
//   POST /clsconfig  -> calls `${PW_API_BASE_URL}/apicls/api_cls.php?action=saveClsconfig` with JSON body

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Path can be "/clsconfig-proxy/clsconfig" or "/clsconfig"
  const segments = url.pathname.split("/").filter(Boolean);
  const route = segments[segments.length - 1] || "";

  const PW_API_BASE_URL = Deno.env.get("PW_API_BASE_URL");
  const PW_API_SECRET = Deno.env.get("PW_API_SECRET");

  if (!PW_API_BASE_URL || !PW_API_SECRET) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing PW_API_BASE_URL or PW_API_SECRET" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const base = PW_API_BASE_URL.replace(/\/+$/, "");

  if (!/^https?:\/\//i.test(base)) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          "PW_API_BASE_URL inválida. Deve ser o domínio/base do servidor (ex.: https://seusite.com). Valor recebido: " +
          base.slice(0, 80),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // Endpoint base: se PW_API_BASE_URL já terminar em .php, usa direto; senão, anexa /apicls/api_cls.php.
  const endpoint = base.endsWith(".php") ? base : `${base}/apicls/api_cls.php`;

  const isClsRoute = route === "clsconfig" || route === "clsconfig-proxy";

  try {
    if (req.method === "GET" && isClsRoute) {
      const target = `${endpoint}?action=getClsconfig`;
      const upstream = await fetch(target, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-sync-secret": PW_API_SECRET,
        },
      });
      return await relay(upstream);
    }

    if (req.method === "POST" && isClsRoute) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return new Response(
          JSON.stringify({ success: false, error: "Body inválido (esperado JSON)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Validação mínima do payload: a VPS indexa o template por roleid (não por cls).
      const b = (body ?? {}) as Record<string, unknown>;
      if (!b.key_hex || !b.template || b.roleid == null) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Payload incompleto: requer key_hex, roleid e template",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const roleidParam = encodeURIComponent(String(b.roleid));
      const target = `${endpoint}?action=saveClsconfigTemplate&roleid=${roleidParam}`;
      console.log(
        "[clsconfig-proxy] POST →",
        target,
        "key_hex:",
        String((body as Record<string, unknown>).key_hex),
        "roleid:",
        String(b.roleid),
      );
      const upstream = await fetch(target, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-sync-secret": PW_API_SECRET,
        },
        body: JSON.stringify(body),
      });
      const cloned = upstream.clone();
      const preview = (await cloned.text()).slice(0, 500);
      console.log("[clsconfig-proxy] upstream status:", upstream.status, "body:", preview);
      return await relay(upstream);
    }

    return new Response(
      JSON.stringify({ success: false, error: "Not found", path: url.pathname, method: req.method }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function relay(upstream: Response): Promise<Response> {
  const text = await upstream.text();
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Upstream returned non-JSON",
        status: upstream.status,
        body: text.slice(0, 2000),
      }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  return new Response(JSON.stringify(json), {
    status: upstream.ok ? 200 : upstream.status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
