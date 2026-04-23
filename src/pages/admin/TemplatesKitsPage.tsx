// /admin/templates/kits — Listagem standalone dos kits iniciais.
// A criação/aplicação detalhada acontece via InitialKitsDialog dentro do
// ClsconfigEditor (porque depende de um template selecionado). Aqui é só
// inventário visual + delete + duplicar.
import { useMemo, useState } from "react";
import {
  Boxes,
  Copy,
  Loader2,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { useInitialKits } from "@/hooks/useInitialKits";
import { countKitItems } from "@/lib/initialKits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const TemplatesKitsPage = () => {
  const { tenantId, can } = useServerPermissions();
  const { cloudKits, loading, deleteKit, duplicateKit } = useInitialKits({
    tenantId,
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...cloudKits].sort((a, b) =>
        (b.updated_at ?? "").localeCompare(a.updated_at ?? ""),
      ),
    [cloudKits],
  );

  const canManage = can("save_templates");

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <Boxes className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold tracking-tight text-foreground">
              Kits iniciais
            </h1>
            <p className="text-xs text-muted-foreground">
              Conjuntos reutilizáveis de itens para aplicar em templates de
              novos personagens.
            </p>
          </div>
          <Link
            to="/admin/templates"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-xs transition-smooth hover:border-primary/50"
            title="Criar/editar kits dentro do editor de templates"
          >
            <Plus className="h-3.5 w-3.5" />
            Novo kit (no editor)
          </Link>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center">
            <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">
              Nenhum kit salvo
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Abra o editor de templates, configure um personagem e salve como
              kit para reutilizar depois.
            </p>
            <Link
              to="/admin/templates"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90"
            >
              Ir para o editor
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {sorted.map((k) => {
              // pwClasses.getClassInfo(race, cls) — sem race, mostramos só
              // o número da classe.
              const clsLabel =
                k.target_cls != null ? `cls ${k.target_cls}` : null;
              return (
                <div
                  key={k.id}
                  className="group rounded-xl border border-border bg-card/60 p-4 transition-smooth hover:border-primary/40"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-background/60 text-primary">
                      <Boxes className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-bold text-foreground">
                        {k.name}
                      </h3>
                      {k.description && (
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                          {k.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                        {clsLabel && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-primary">
                            {clsLabel}
                          </span>
                        )}
                        {k.visibility && (
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
                            {k.visibility === "server" ? "Servidor" : "Privado"}
                          </span>
                        )}
                        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-muted-foreground">
                          {countKitItems(k)} itens
                        </span>
                      </div>
                    </div>
                  </div>
                  {canManage && (
                    <div className="mt-3 flex items-center justify-end gap-1 border-t border-border pt-2 opacity-60 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={async () => {
                          const r = await duplicateKit(k.id);
                          if (r) toast.success("Kit duplicado");
                          else toast.error("Falha ao duplicar");
                        }}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Duplicar"
                      >
                        <Copy className="h-3 w-3" />
                        Duplicar
                      </button>
                      <button
                        onClick={() => setConfirmDelete(k.id)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] text-destructive hover:bg-destructive/10"
                        title="Apagar"
                      >
                        <Trash2 className="h-3 w-3" />
                        Apagar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog
        open={!!confirmDelete}
        onOpenChange={(o) => !o && setConfirmDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar este kit?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O kit será removido do servidor.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!confirmDelete) return;
                const ok = await deleteKit(confirmDelete);
                if (ok) toast.success("Kit apagado");
                else toast.error("Falha ao apagar");
                setConfirmDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Apagar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TemplatesKitsPage;
