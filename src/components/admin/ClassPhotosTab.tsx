// Gerenciamento de fotos por classe — lista todas as classes do servidor
// e permite trocar/remover a imagem usada como avatar central.
import { useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Loader2, RefreshCw } from "lucide-react";
import type { ApiClass } from "@/types/clsconfig";
import { useClsconfig } from "@/hooks/useClsconfig";
import { fetchClassPhotos, removeClassPhoto, uploadClassPhoto } from "@/lib/photos";
import { buildClassIconUrl } from "@/lib/pwIcons";
import { PhotoUploadButton } from "./PhotoUploadButton";
import { toast } from "@/hooks/use-toast";

export const ClassPhotosTab = () => {
  const { data, loading, reload } = useClsconfig();
  const [photos, setPhotos] = useState<Map<number, string>>(new Map());
  const [photosLoading, setPhotosLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const classes: ApiClass[] = data?.classes ?? [];

  const refreshPhotos = async () => {
    setPhotosLoading(true);
    try {
      setPhotos(await fetchClassPhotos());
    } catch (e) {
      toast({
        title: "Erro ao carregar fotos",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setPhotosLoading(false);
    }
  };

  useEffect(() => {
    void refreshPhotos();
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.race.toLowerCase().includes(q) ||
        String(c.id).includes(q),
    );
  }, [classes, filter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold uppercase tracking-wider text-foreground">
            <ImageIcon className="h-5 w-5 text-primary" />
            Fotos das Classes
          </h2>
          <p className="text-xs text-muted-foreground">
            Imagem padrão usada no centro do equipamento para cada classe. Personagens
            individuais podem sobrescrever pela tela de equipamento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar (nome, raça, id)…"
            className="h-9 w-56 rounded-md border border-border bg-card/60 px-3 text-xs outline-none focus:border-primary/50"
          />
          <button
            onClick={() => {
              void refreshPhotos();
              reload();
            }}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-primary/50"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recarregar
          </button>
        </div>
      </div>

      {loading || photosLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
          Nenhuma classe encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((c) => {
            const customUrl = photos.get(c.id);
            const fallbackUrl = buildClassIconUrl(c.icon_path);
            const url = customUrl ?? fallbackUrl;
            const isCustom = !!customUrl;

            return (
              <article
                key={c.id}
                className="flex flex-col overflow-hidden rounded-lg border border-border bg-card/40 transition-smooth hover:border-primary/40"
              >
                <div
                  className="relative bg-muted/30"
                  style={{ aspectRatio: "3 / 4" }}
                >
                  {url ? (
                    <img
                      src={url}
                      alt={c.name}
                      loading="lazy"
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground">
                      {c.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span
                    className="absolute left-2 top-2 rounded-sm px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                    style={{
                      background: "hsl(0 0% 0% / 0.75)",
                      color: isCustom ? "hsl(45 80% 65%)" : "hsl(0 0% 70%)",
                    }}
                  >
                    {isCustom ? "Personalizada" : "Padrão"}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-3">
                  <div>
                    <div className="text-sm font-bold text-foreground">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.race} · cls {c.id}
                    </div>
                  </div>
                  <div className="mt-auto">
                    <PhotoUploadButton
                      label={isCustom ? "Trocar" : "Enviar foto"}
                      onUpload={async (file) => {
                        await uploadClassPhoto(c.id, file);
                        await refreshPhotos();
                      }}
                      onRemove={
                        isCustom
                          ? async () => {
                              await removeClassPhoto(c.id);
                              await refreshPhotos();
                            }
                          : undefined
                      }
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
