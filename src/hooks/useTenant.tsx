import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Tenant {
  id: string;
  owner_id: string;
  server_name: string;
  pw_api_base_url: string | null;
  pw_api_secret: string | null;
  icon_base_url: string | null;
  logo_url: string | null;
  primary_color: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

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
      .select("*")
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
