import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppSettings {
  server_name: string;
  pw_api_base_url: string | null;
  icon_base_url: string;
  logo_url: string | null;
  primary_color: string | null;
}

interface Ctx {
  settings: AppSettings;
  loading: boolean;
  reload: () => Promise<void>;
}

const DEFAULTS: AppSettings = {
  server_name: "Perfect World Admin",
  pw_api_base_url: null,
  icon_base_url: "http://93.127.143.77/",
  logo_url: null,
  primary_color: null,
};

const AppSettingsContext = createContext<Ctx>({
  settings: DEFAULTS,
  loading: true,
  reload: async () => {},
});

export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    // Tenta ler tabela completa (se admin) — senão cai pro branding público.
    const { data: full } = await supabase
      .from("app_settings")
      .select("server_name, pw_api_base_url, icon_base_url, logo_url, primary_color")
      .eq("id", 1)
      .maybeSingle();

    if (full) {
      setSettings({
        server_name: full.server_name ?? DEFAULTS.server_name,
        pw_api_base_url: full.pw_api_base_url,
        icon_base_url: full.icon_base_url ?? DEFAULTS.icon_base_url,
        logo_url: full.logo_url,
        primary_color: full.primary_color,
      });
    } else {
      const { data: pub } = await supabase.rpc("get_public_branding");
      const row = Array.isArray(pub) ? pub[0] : null;
      if (row) {
        setSettings({
          ...DEFAULTS,
          server_name: row.server_name ?? DEFAULTS.server_name,
          logo_url: row.logo_url,
          primary_color: row.primary_color,
        });
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppSettingsContext.Provider value={{ settings, loading, reload: load }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppSettingsContext);
