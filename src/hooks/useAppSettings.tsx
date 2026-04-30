import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import defaultLogo from "@/assets/orphea-core-logo.png";

export interface AppSettings {
  server_name: string;
  pw_api_base_url: string | null;
  icon_base_url: string;
  logo_url: string | null;
  primary_color: string | null;
  background_url: string | null;
  favicon_url: string | null;
  footer_text: string | null;
  footer_link_label: string | null;
  footer_link_url: string | null;
}

interface Ctx {
  settings: AppSettings;
  loading: boolean;
  reload: () => Promise<void>;
}

const DEFAULTS: AppSettings = {
  server_name: "Orphea Core",
  pw_api_base_url: null,
  icon_base_url: "http://93.127.143.77/",
  logo_url: defaultLogo,
  primary_color: null,
  background_url: null,
  favicon_url: null,
  footer_text: "Desenvolvido por:",
  footer_link_label: "Sath~",
  footer_link_url: "https://discord.gg/lovable-dev",
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
      .select("server_name, pw_api_base_url, icon_base_url, logo_url, primary_color, background_url, favicon_url, footer_text, footer_link_label, footer_link_url")
      .eq("id", 1)
      .maybeSingle();

    if (full) {
      setSettings({
        server_name: full.server_name ?? DEFAULTS.server_name,
        pw_api_base_url: full.pw_api_base_url,
        icon_base_url: full.icon_base_url ?? DEFAULTS.icon_base_url,
        logo_url: full.logo_url ?? DEFAULTS.logo_url,
        primary_color: full.primary_color,
        background_url: full.background_url ?? null,
        favicon_url: full.favicon_url ?? null,
        footer_text: full.footer_text ?? DEFAULTS.footer_text,
        footer_link_label: full.footer_link_label ?? DEFAULTS.footer_link_label,
        footer_link_url: full.footer_link_url ?? DEFAULTS.footer_link_url,
      });
    } else {
      const { data: pub } = await supabase.rpc("get_public_branding");
      const row = Array.isArray(pub) ? pub[0] : null;
      if (row) {
        setSettings({
          ...DEFAULTS,
          server_name: row.server_name ?? DEFAULTS.server_name,
          logo_url: row.logo_url ?? DEFAULTS.logo_url,
          primary_color: row.primary_color,
          background_url: row.background_url ?? null,
          favicon_url: row.favicon_url ?? null,
          footer_text: row.footer_text ?? DEFAULTS.footer_text,
          footer_link_label: row.footer_link_label ?? DEFAULTS.footer_link_label,
          footer_link_url: row.footer_link_url ?? DEFAULTS.footer_link_url,
        });
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Aplica favicon dinâmico se configurado
  useEffect(() => {
    if (!settings.favicon_url) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = settings.favicon_url;
  }, [settings.favicon_url]);

  return (
    <AppSettingsContext.Provider value={{ settings, loading, reload: load }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => useContext(AppSettingsContext);
