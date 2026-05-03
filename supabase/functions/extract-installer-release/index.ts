// Edge function: extract-installer-release
// Downloads a .zip from installer-releases bucket, extracts all files,
// and uploads them individually to installer-releases/current/<filename>
// so the /install page can serve the latest versions.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import JSZip from "https://esm.sh/jszip@3.10.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate JWT — must be an authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify the caller is authenticated (use their token to check)
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check superadmin role
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: hasRole } = await adminClient.rpc("has_role", {
      _user_id: user.id,
      _role: "superadmin",
    });
    if (!hasRole) {
      return new Response(JSON.stringify({ error: "Superadmin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request
    const body = await req.json();
    const filePath: string = body.file_path;
    if (!filePath) {
      return new Response(JSON.stringify({ error: "file_path required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the zip from storage
    const { data: zipData, error: dlErr } = await adminClient.storage
      .from("installer-releases")
      .download(filePath);
    if (dlErr || !zipData) {
      return new Response(
        JSON.stringify({ error: `Failed to download: ${dlErr?.message ?? "no data"}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Extract zip
    const zip = await JSZip.loadAsync(await zipData.arrayBuffer());
    const extracted: string[] = [];
    const errors: string[] = [];

    // First, remove old "current/" files
    const { data: oldFiles } = await adminClient.storage
      .from("installer-releases")
      .list("current", { limit: 100 });
    if (oldFiles && oldFiles.length > 0) {
      const oldPaths = oldFiles.map((f) => `current/${f.name}`);
      await adminClient.storage.from("installer-releases").remove(oldPaths);
    }

    // Process each file in the zip
    for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;

      // Get just the filename (strip any directory prefix in the zip)
      const fileName = relativePath.split("/").pop();
      if (!fileName) continue;

      try {
        const content = await zipEntry.async("uint8array");
        const targetPath = `current/${fileName}`;

        // Determine content type
        let contentType = "application/octet-stream";
        if (fileName.endsWith(".php")) contentType = "application/x-php";
        else if (fileName.endsWith(".sh")) contentType = "application/x-shellscript";
        else if (fileName.endsWith(".md")) contentType = "text/markdown";
        else if (fileName.endsWith(".txt")) contentType = "text/plain";

        const { error: upErr } = await adminClient.storage
          .from("installer-releases")
          .upload(targetPath, content, {
            contentType,
            upsert: true,
          });

        if (upErr) {
          errors.push(`${fileName}: ${upErr.message}`);
        } else {
          extracted.push(fileName);
        }
      } catch (e) {
        errors.push(`${fileName}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        extracted,
        errors: errors.length > 0 ? errors : undefined,
        count: extracted.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
