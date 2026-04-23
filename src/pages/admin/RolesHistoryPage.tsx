// /admin/roles/historico — Histórico de saves desta sessão.
// Reusa o conteúdo do HistoryDrawer mas em página completa.
import { History, Trash2 } from "lucide-react";
import { saveHistory, useSaveHistory } from "@/lib/saveHistory";
import { cn } from "@/lib/utils";

const RolesHistoryPage = () => {
  const entries = useSaveHistory();

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <History className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold tracking-tight text-foreground">
              Histórico desta sessão
            </h1>
            <p className="text-xs text-muted-foreground">
              Lista temporária de alterações feitas neste navegador.
            </p>
          </div>
          {entries.length > 0 && (
            <button
              type="button"
              onClick={() => saveHistory.clear()}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-3 py-2 text-[11px] text-destructive transition-smooth hover:border-destructive/50"
            >
              <Trash2 className="h-3 w-3" />
              Limpar
            </button>
          )}
        </header>

        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-8 text-center text-sm text-muted-foreground">
            Nenhuma alteração registrada nesta sessão.
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li
                key={e.id}
                className={cn(
                  "rounded-lg border border-border bg-card/60 p-3 text-xs",
                  e.status === "error" && "border-destructive/40",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-foreground">
                    {e.className}{" "}
                    <span className="font-mono text-muted-foreground">
                      · {e.field}
                    </span>
                  </span>
                  <time className="font-mono text-[10px] text-muted-foreground">
                    {new Date(e.ts).toLocaleString("pt-BR")}
                  </time>
                </div>
                <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                  roleid {e.roleid} · {e.oldValue || "—"} → {e.newValue || "—"}
                </div>
                {e.error && (
                  <div className="mt-1 text-[11px] text-destructive">
                    {e.error}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default RolesHistoryPage;
