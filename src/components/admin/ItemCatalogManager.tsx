import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FolderUp, Loader2, Package, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useItemCatalog } from "@/context/ItemCatalogContext";
import { parseItemTab } from "@/lib/itemTab";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CatalogRow {
  id: string;
  name: string;
  tab_path: string;
  icons_prefix: string;
  item_count: number;
  is_active: boolean;
  created_at: string;
}

export const ItemCatalogManager = () => {
  const { catalog, items, reload } = useItemCatalog();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<CatalogRow[]>([]);
  const [tabFile, setTabFile] = useState<File | null>(null);
  const [iconFiles, setIconFiles] = useState<File[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const iconsInputRef = useRef<HTMLInputElement>(null);

  const fetchList = async () => {
    const { data } = await supabase
      .from("item_catalogs")
      .select("*")
      .order("created_at", { ascending: false });
    setList((data ?? []) as CatalogRow[]);
  };

  useEffect(() => {
    if (open) void fetchList();
  }, [open]);

  const handleUpload = async () => {
    if (!tabFile) {
      toast.error("Selecione o arquivo .tab");
      return;
    }
    if (!name.trim()) {
      toast.error("Dê um nome ao catálogo");
      return;
    }
    setBusy(true);
    try {
      const slug = `${Date.now()}-${name.trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`;
      const tabPath = `tabs/${slug}.tab`;
      const iconsPrefix = `icons/${slug}/`;

      // 1) Upload .tab
      const tabBuf = await tabFile.text();
      const parsed = parseItemTab(tabBuf);
      const { error: tabErr } = await supabase.storage
        .from("pw-assets")
        .upload(tabPath, new Blob([tabBuf], { type: "text/tab-separated-values" }), {
          upsert: true,
        });
      if (tabErr) throw tabErr;

      // 2) Upload de ícones (em lotes paralelos)
      if (iconFiles.length > 0) {
        setProgress({ done: 0, total: iconFiles.length });
        const concurrency = 6;
        let done = 0;
        const queue = [...iconFiles];
        await Promise.all(
          Array.from({ length: concurrency }, async () => {
            while (queue.length) {
              const f = queue.shift();
              if (!f) break;
              const path = `${iconsPrefix}${f.name}`;
              const { error } = await supabase.storage
                .from("pw-assets")
                .upload(path, f, { upsert: true, contentType: f.type || "image/jpeg" });
              if (error) console.warn("[icons] falhou", f.name, error.message);
              done += 1;
              setProgress({ done, total: iconFiles.length });
            }
          }),
        );
      }

      // 3) Insere catálogo ativo
      const { error: dbErr } = await supabase.from("item_catalogs").insert({
        name: name.trim(),
        tab_path: tabPath,
        icons_prefix: iconsPrefix,
        item_count: parsed.size,
        is_active: true,
      });
      if (dbErr) throw dbErr;

      toast.success(`Catálogo "${name}" salvo (${parsed.size} itens)`);
      setName("");
      setTabFile(null);
      setIconFiles([]);
      if (iconsInputRef.current) iconsInputRef.current.value = "";
      setProgress(null);
      await Promise.all([reload(), fetchList()]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const setActive = async (id: string) => {
    await supabase.from("item_catalogs").update({ is_active: true }).eq("id", id);
    await Promise.all([reload(), fetchList()]);
    toast.success("Catálogo ativado");
  };

  const remove = async (row: CatalogRow) => {
    if (!confirm(`Remover catálogo "${row.name}"?`)) return;
    await supabase.from("item_catalogs").delete().eq("id", row.id);
    await Promise.all([reload(), fetchList()]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-primary/50"
        >
          <Package className="h-3.5 w-3.5" />
          Itens & ícones
          {catalog ? (
            <span className="rounded bg-success/15 px-1.5 py-0.5 text-[10px] font-bold text-success">
              {items.size}
            </span>
          ) : (
            <span className="rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning">
              vazio
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl border-border bg-card">
        <DialogHeader>
          <DialogTitle>Catálogo de itens (.tab + ícones)</DialogTitle>
          <DialogDescription>
            Suba o arquivo <code className="font-mono">.tab</code> exportado do PW e a pasta de
            ícones <code className="font-mono">.jpg</code> (nome do arquivo = id do item).
          </DialogDescription>
        </DialogHeader>

        {/* Upload */}
        <div className="space-y-3 rounded-lg border border-border bg-background/40 p-4">
          <label className="block">
            <span className="uppercase-label mb-1 block">Nome do catálogo</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: PWOld 1.5.5 PT-BR"
              className="w-full rounded-md border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="uppercase-label mb-1 block">Arquivo .tab</span>
              <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-background/40 p-3 text-xs">
                <Upload className="h-4 w-4 text-primary" />
                <input
                  type="file"
                  accept=".tab,.tsv,.txt"
                  onChange={(e) => setTabFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-primary-foreground"
                />
              </div>
              {tabFile && (
                <p className="mt-1 truncate font-mono text-[11px] text-muted-foreground">
                  {tabFile.name} · {(tabFile.size / 1024).toFixed(1)} KB
                </p>
              )}
            </label>

            <label className="block">
              <span className="uppercase-label mb-1 block">Ícones (.jpg) — selecione um ou vários</span>
              <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-background/40 p-3 text-xs">
                <FolderUp className="h-4 w-4 text-primary" />
                <input
                  ref={iconsInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  multiple
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    if (!picked.length) return;
                    // acrescenta sem duplicar (por nome)
                    setIconFiles((prev) => {
                      const seen = new Set(prev.map((f) => f.name));
                      return [...prev, ...picked.filter((f) => !seen.has(f.name))];
                    });
                    // permite re-selecionar o mesmo arquivo depois
                    if (iconsInputRef.current) iconsInputRef.current.value = "";
                  }}
                  className="block w-full text-xs file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-primary-foreground"
                />
              </div>
              {iconFiles.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                    <span>{iconFiles.length} ícone(s) na fila</span>
                    <button
                      type="button"
                      onClick={() => setIconFiles([])}
                      className="text-destructive hover:underline"
                    >
                      limpar
                    </button>
                  </div>
                  <ul className="max-h-32 space-y-0.5 overflow-y-auto rounded border border-border/60 bg-background/40 p-1">
                    {iconFiles.map((f, i) => (
                      <li
                        key={`${f.name}-${i}`}
                        className="flex items-center justify-between gap-2 rounded px-1.5 py-0.5 font-mono text-[10px] hover:bg-muted/30"
                      >
                        <span className="truncate">{f.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setIconFiles((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="text-destructive opacity-60 hover:opacity-100"
                          aria-label={`remover ${f.name}`}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </label>
          </div>

          {progress && (
            <div className="rounded-md border border-border bg-background/60 p-2 font-mono text-[11px]">
              Enviando ícones: {progress.done}/{progress.total}
              <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted/40">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(progress.done / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleUpload}
            disabled={busy || !tabFile}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-smooth hover:brightness-110 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Enviar e ativar
          </button>
        </div>

        {/* Lista */}
        <div className="max-h-64 space-y-2 overflow-y-auto">
          <div className="uppercase-label">Catálogos enviados</div>
          {list.length === 0 ? (
            <p className="rounded-md border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
              Nenhum catálogo ainda.
            </p>
          ) : (
            list.map((row) => (
              <div
                key={row.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-background/40 p-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    {row.is_active && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                    <span className="truncate">{row.name}</span>
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {row.item_count} itens · {new Date(row.created_at).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {!row.is_active && (
                    <button
                      type="button"
                      onClick={() => setActive(row.id)}
                      className="rounded border border-border px-2 py-1 hover:border-primary/50"
                    >
                      Ativar
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(row)}
                    className="rounded border border-border px-2 py-1 text-destructive hover:border-destructive/50"
                  >
                    Remover
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
