// Edge Function: download-api-cls
// Returns the api_cls.php bridge file with the caller's tenant secret already
// embedded into the $SECRET constant. The user just uploads it to their VPS —
// no manual editing required.
//
// AUTH: validates the JWT, looks up the caller's tenant row, and refuses if
// no secret is configured. Without the secret embed there's no point in
// downloading the file.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Escape a string so it can be safely placed inside a PHP single-quoted
 * literal. Only `\` and `'` need escaping in single-quoted PHP strings.
 */
function phpSingleQuoteEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function buildPhp(secret: string): string {
  const safeSecret = phpSingleQuoteEscape(secret);
  return `<?php
/**
 * api_cls.php — bridge endpoint for PW Admin
 *
 * Generated automatically by PW Admin with your personal secret embedded.
 * Upload this file to a web-accessible folder on your VPS (e.g. /var/www/html/)
 * and point your panel's "URL da API" at it.
 *
 * SECURITY:
 *  - Keep this file private. Anyone who reads $SECRET below can call your API.
 *  - If you suspect leakage, generate a new secret in PW Admin → Configurações
 *    and re-download this file.
 */

// === Secret shared with PW Admin (DO NOT EDIT MANUALLY) ===
\$SECRET = '${safeSecret}';

// Reject any request that does not present the matching secret header.
\$provided = isset(\$_SERVER['HTTP_X_SYNC_SECRET']) ? \$_SERVER['HTTP_X_SYNC_SECRET'] : '';
if (!hash_equals(\$SECRET, \$provided)) {
  http_response_code(401);
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}

header('Content-Type: application/json');

// TODO: include your existing PW DB logic here.
// The PW Admin team ships the full bridge implementation separately;
// this stub only proves the secret is wired correctly.
echo json_encode([
  'success' => true,
  'message' => 'api_cls.php is alive. Replace this stub with the full bridge implementation.',
]);
`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return jsonError("Method not allowed", 405);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonError("Unauthorized", 401);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return jsonError("Auth misconfigured", 500);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) {
    return jsonError("Unauthorized", 401);
  }

  // Read secret from the dedicated tenant_secrets table via RPC (owner-scoped)
  const { data: secretData, error: tenantErr } = await supabase.rpc("get_my_tenant_secret");

  if (tenantErr) {
    return jsonError("Failed to load tenant", 500);
  }
  const secret = (tenant?.pw_api_secret as string | null) ?? "";
  if (!secret) {
    return jsonError(
      "Configure o secret da API antes de baixar o arquivo.",
      400,
    );
  }

  const php = buildPhp(secret);
  return new Response(php, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/x-httpd-php",
      "Content-Disposition": 'attachment; filename="api_cls.php"',
      "Cache-Control": "no-store",
    },
  });
});
