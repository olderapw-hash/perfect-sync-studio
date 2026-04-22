// Cliente para a edge function `test-server-connection`.
// NUNCA chama a VPS direto do navegador — sempre via proxy autenticado.
import { supabase } from "@/integrations/supabase/client";

export interface TestConnectionResult {
  success: boolean;
  http_status?: number;
  elapsed_ms?: number;
  entries?: number | null;
  endpoint?: string;
  error?: string | null;
}

export async function testServerConnection(input: {
  url?: string;
  secret?: string;
  tenant_id?: string;
}): Promise<TestConnectionResult> {
  const { data, error } = await supabase.functions.invoke("test-server-connection", {
    method: "POST",
    body: input,
  });
  if (error) {
    const ctx = (error as unknown as { context?: Response }).context;
    let extra = "";
    if (ctx && typeof ctx.text === "function") {
      try {
        extra = await ctx.text();
      } catch {
        /* ignore */
      }
    }
    return { success: false, error: extra || error.message };
  }
  return data as TestConnectionResult;
}
