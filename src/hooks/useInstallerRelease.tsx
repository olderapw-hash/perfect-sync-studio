// Hook que entrega a release atual do installer e ajuda a controlar
// a notificação "vista" (toast/badge mostrado uma vez por versão).
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InstallerRelease {
  id: string;
  version: string;
  changelog: string | null;
  file_url: string;
  file_path: string;
  file_size_bytes: number | null;
  is_current: boolean;
  published_at: string;
  published_by: string;
}

const SEEN_KEY = "installer_release_seen_version";

export const useInstallerRelease = () => {
  const [current, setCurrent] = useState<InstallerRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [seenVersion, setSeenVersion] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SEEN_KEY);
    } catch {
      return null;
    }
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("installer_releases")
      .select("*")
      .eq("is_current", true)
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error) setCurrent((data as InstallerRelease | null) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markSeen = useCallback((version: string) => {
    try {
      localStorage.setItem(SEEN_KEY, version);
    } catch {
      /* ignore */
    }
    setSeenVersion(version);
  }, []);

  const hasUpdate = !!current && current.version !== seenVersion;

  return { current, loading, refresh, hasUpdate, seenVersion, markSeen };
};
