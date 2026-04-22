// Resolve a foto a exibir para um personagem:
//   1) override por roleid (character_photos)
//   2) foto da classe (class_photos)
//   3) fallback para a URL do class_icon_path da API (passada por argumento)
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseCharacterPhotoArgs {
  roleid: number;
  cls: number;
  fallbackUrl: string | null;
}

interface UsePhotoState {
  url: string | null;
  source: "character" | "class" | "fallback" | "none";
  loading: boolean;
  reload: () => void;
}

export function useCharacterPhoto({
  roleid,
  cls,
  fallbackUrl,
}: UseCharacterPhotoArgs): UsePhotoState {
  const [url, setUrl] = useState<string | null>(fallbackUrl);
  const [source, setSource] = useState<UsePhotoState["source"]>(
    fallbackUrl ? "fallback" : "none",
  );
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      // 1) tenta override do personagem
      if (roleid && roleid > 0) {
        const { data: char } = await supabase
          .from("character_photos")
          .select("public_url")
          .eq("roleid", roleid)
          .maybeSingle();
        if (cancelled) return;
        if (char?.public_url) {
          setUrl(char.public_url);
          setSource("character");
          setLoading(false);
          return;
        }
      }
      // 2) foto da classe
      const { data: clsRow } = await supabase
        .from("class_photos")
        .select("public_url")
        .eq("cls", cls)
        .maybeSingle();
      if (cancelled) return;
      if (clsRow?.public_url) {
        setUrl(clsRow.public_url);
        setSource("class");
        setLoading(false);
        return;
      }
      // 3) fallback
      setUrl(fallbackUrl);
      setSource(fallbackUrl ? "fallback" : "none");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [roleid, cls, fallbackUrl, tick]);

  return { url, source, loading, reload: () => setTick((t) => t + 1) };
}
