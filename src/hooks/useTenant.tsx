import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

/**
 * Tenant shape used across the UI. We intentionally exclude `pw_api_secret`
 * here — it is a sensitive credential and must never live in shared client
 * state. Fetch it on-demand inside the Settings/Onboarding form using a
 * dedicated query (see fetchTenantSecret below).
 */
export interface Tenant {
  id: string;
  owner_id: string;
  server_name: string;
  pw_api_base_url: string | null;
  icon_base_url: string | null;
  logo_url: string | null;
  primary_color: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

const TENANT_COLUMNS =
  "id, owner_id, server_name, pw_api_base_url, icon_base_url, logo_url, primary_color, onboarding_completed, created_at, updated_at";

export function useTenant() {
  const { session } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenant = async () => {
    if (!session?.user) {
      setTenant(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("tenants")
      .select(TENANT_COLUMNS)
      .eq("owner_id", session.user.id)
      .maybeSingle();
    setTenant(data as Tenant | null);
    setLoading(false);
  };

  useEffect(() => {
    fetchTenant();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  return { tenant, loading, refetch: fetchTenant };
}

/**
 * On-demand fetch of the tenant's PW API secret. Only call this from forms
 * that actually need to display/edit the secret (e.g. Onboarding, Settings).
 * Returns `null` if no tenant exists or the secret is unset.
 */
export async function fetchTenantSecret(_userId?: string): Promise<string | null> {
  // Reads via SECURITY DEFINER RPC scoped to auth.uid() so the secret
  // column is never returned through generic SELECTs on the tenants table.
  const { data, error } = await supabase.rpc("get_my_tenant_secret");
  if (error) return null;
  return (data as string | null) ?? null;
}
