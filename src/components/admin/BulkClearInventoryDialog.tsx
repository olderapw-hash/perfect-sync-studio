// Diálogo "Limpar inventário em massa" — modo TEMPLATE.
//
// Fluxo:
//  1. Preview lista todos os entries alvo (roleid, nome, cls, class_name).
//  2. Opções:
//     - Limpar itens (sempre marcado, obrigatório).
//     - Limpar dinheiro (checkbox opcional, default false).
//     - Remover slots fora da capacidade (default false).
//  3. Confirmação forte: usuário precisa digitar "LIMPAR INVENTARIO EM TODOS".
//  4. Para cada roleid: monta payload mínimo via buildClearInventoryPayload,
//     valida com validateItems, e envia via clsconfig-proxy.
//  5. Continua mesmo se um falhar. Exibe relatório final com backups.
//  6. Audita action="inventory.bulk_clear".
//
// NÃO altera equipment, storehouse, task, status ou base.
// Backup gamedbd é gerado pela própria API antes de salvar.
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eraser,
  Info,
  Loader2,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import type { ClsEntry } from "@/types/clsconfig";
import {
  buildClearInventoryPayload,
  countFilledInventory,
  countOutOfCapacity,
} from "@/lib/bulkInventoryTools";
import { summarizeIssues, validateItems } from "@/lib/validateItem";
import { invokeClsconfigProxy } from "@/lib/clsconfigInvoke";
import { handleMaybeAuthError } from "@/lib/authErrors";
import { logAuditEvent } from "@/lib/auditLog";
import { seenBackups } from "@/lib/seenBackups";

const CONFIRM_PHRASE = "LIMPAR INVENTARIO EM TODOS";

type RowStatus = "pending" | "running" | "ok" | "skipped" | "error";

interface RowResult {
  roleid: number;
  name: string;
  className: string;
  cls: number;
  filledBefore: number;
  outOfCapacity: number;
  status: RowStatus;
  message?: string;
  backupRoleJson?: string;
  backupClsconfigFile?: string;
  gamedbdBackup?: string;
  exportLogFile?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Todos os entries (templates) carregados — alvos potenciais. */
  allEntries: ClsEntry[];
  /** Tenant ativo (para auditoria). */
  tenantId?: string | null;
  /** Disparado após o bulk concluir, mesmo com erros parciais. */
  onBulkReload?: () => void;
}

const extractStr = (obj: unknown, path: string[]): string | undefined => {
  let cur: unknown = obj;
  for (const key of path) {
    if (cur && typeof cur === "object" && key in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
};

export const BulkClearInventoryDialog = ({
  open,
  onOpenChange,
  allEntries,
  tenantId,
  onBulkReload,
}: Props) => {
  const [clearMoney, setClearMoney] = useState(false);
  const [removeOutOfCapacity, setRemoveOutOfCapacity] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<number, RowResult>>({});
  const [finished, setFinished] = useState(false);

  // Reset on open.
  useEffect(() => {
    if (!open) return;
    setClearMoney(false);
    setRemoveOutOfCapacity(false);
    setConfirmText("");
    setResults({});
    setFinished(false);
  }, [open]);

  const targets = useMemo(
    () =>
      allEntries
        .filter((e) => Number.isFinite(e.template.roleid) && e.template.roleid > 0)
        .map((e) => ({
          entry: e,
          roleid: e.template.roleid,
          name: e.template.summary.name || "(sem nome)",
          className: e.template.summary.class_name ?? `cls ${e.template.summary.cls}`,
          cls: e.template.summary.cls,
          filled: countFilledInventory(e.template),
          ooc: countOutOfCapacity(e.template),
        })),
    [allEntries],
  );

  const totalFilled = targets.reduce((n, t) => n + t.filled, 0);
  const totalOOC = targets.reduce((n, t) => n + t.ooc, 0);

  const phraseOk = confirmText.trim().toUpperCase() === CONFIRM_PHRASE;
  const canRun = !running && !finished && targets.length > 0 && phraseOk;

  const summary = useMemo(() => {
    const list = Object.values(results);
    return {
      ok: list.filter((r) => r.status === "ok").length,
      skipped: list.filter((r) => r.status === "skipped").length,
      error: list.filter((r) => r.status === "error").length,
    };
  }, [results]);

  const run = async () => {
    if (!canRun) return;
    setRunning(true);
    setFinished(false);

    // Inicializa todos como pending.
    const initial: Record<number, RowResult> = {};
    for (const t of targets) {
      initial[t.roleid] = {
        roleid: t.roleid,
        name: t.name,
        className: t.className,
        cls: t.cls,
        filledBefore: t.filled,
        outOfCapacity: t.ooc,
        status: "pending",
      };
    }
    setResults(initial);

    let okCount = 0;
    let skipCount = 0;
    let errCount = 0;

    for (const t of targets) {
      const rid = t.roleid;
      setResults((prev) => ({ ...prev, [rid]: { ...prev[rid], status: "running" } }));

      try {
        const payload = buildClearInventoryPayload(t.entry.template, {
          clearMoney,
          removeOutOfCapacity,
        });

        // Valida — mesmo sendo "tudo zero", roda pra detectar capacity inválida etc.
        const issues = summarizeIssues(
          validateItems(payload.inventory.items, {
            section: "inventory.items",
            tab: "inventory",
            label: "Inventário",
            capacity: payload.inventory.capacity,
          }),
        );
        if (issues.hasBlocking) {
          skipCount++;
          const first = [...issues.criticals, ...issues.errors][0];
          setResults((prev) => ({
            ...prev,
            [rid]: {
              ...prev[rid],
              status: "skipped",
              message: first?.message ?? "validação bloqueou",
            },
          }));
          continue;
        }

        const { data, error, rawBody } = await invokeClsconfigProxy(
          "clsconfig-proxy/clsconfig",
          { method: "POST", body: payload },
        );
        if (error) {
          throw new Error(rawBody ? `${error.message}\n${rawBody}` : error.message);
        }
        if (data && typeof data === "object" && (data as { success?: boolean }).success === false) {
          throw new Error((data as { error?: string }).error || "save falhou");
        }

        const backupRoleJson =
          extractStr(data, ["saved", "backup", "file"]) ??
          extractStr(data, ["saved", "backups", "role_json", "file"]);
        const backupClsconfigFile =
          extractStr(data, ["saved", "clsconfig_file_backup", "file"]) ??
          extractStr(data, ["saved", "backups", "clsconfig_file", "file"]);
        const gamedbdBackup =
          extractStr(data, ["saved", "gamedbd_backup"]) ??
          extractStr(data, ["saved", "backups", "gamedbd", "file"]);
        const exportLogFile = extractStr(data, ["saved", "export", "log_file"]);

        if (backupRoleJson) seenBackups.add(rid, "role_json", backupRoleJson);
        if (backupClsconfigFile) seenBackups.add(rid, "clsconfig_file", backupClsconfigFile);

        okCount++;
        setResults((prev) => ({
          ...prev,
          [rid]: {
            ...prev[rid],
            status: "ok",
            message: "limpo",
            backupRoleJson,
            backupClsconfigFile,
            gamedbdBackup,
            exportLogFile,
          },
        }));
      } catch (e) {
        errCount++;
        const msg = e instanceof Error ? e.message : "erro";
        handleMaybeAuthError(e);
        setResults((prev) => ({
          ...prev,
          [rid]: { ...prev[rid], status: "error", message: msg },
        }));
        // CONTINUA — não para no primeiro erro.
      }
    }

    // Auditoria.
    void logAuditEvent({
      action: "inventory.bulk_clear",
      tenantId: tenantId ?? null,
      target: `${targets.length} roleids`,
      status: errCount > 0 ? "error" : "ok",
      metadata: {
        target_count: targets.length,
        success_count: okCount,
        skipped_count: skipCount,
        error_count: errCount,
        clear_money: clearMoney,
        preserve_out_of_capacity: !removeOutOfCapacity,
      },
    });

    setRunning(false);
    setFinished(true);

    if (errCount === 0 && skipCount === 0) {
      toast.success(`Inventários limpos em ${okCount} roleid(s)`);
    } else if (errCount === 0) {
      toast.warning(`${okCount} ok · ${skipCount} ignorado(s)`);
    } else {
      toast.error(`${okCount} ok · ${skipCount} ignorado(s) · ${errCount} erro(s)`);
    }

    onBulkReload?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (running) return; // não fechar enquanto roda
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Eraser className="h-5 w-5" />
            Limpar inventário em massa
          </DialogTitle>
          <DialogDescription>
            Esvazia o inventário de TODOS os templates CLS carregados. Equipamento,
            baú, tarefas e status NÃO são alterados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Avisos */}
          <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs">
            <div className="mb-1 flex items-center gap-1.5 font-semibold text-warning">
              <ShieldAlert className="h-3.5 w-3.5" />
              O que será preservado
            </div>
            <ul className="ml-5 list-disc space-y-0.5 text-muted-foreground">
              <li><span className="font-mono">capacity</span>, <span className="font-mono">timestamp</span>, <span className="font-mono">reserved6</span>, <span className="font-mono">reserved7</span> — mantidos.</li>
              <li>Seções <span className="font-mono">equipment</span>, <span className="font-mono">storehouse</span>, <span className="font-mono">task</span>, <span className="font-mono">status</span>, <span className="font-mono">base</span> — intactas.</li>
              <li>A API gera backup automático do <span className="font-mono">gamedbd</span> antes de aplicar cada save.</li>
            </ul>
          </div>

          {/* Opções */}
          <div className="rounded-md border border-border bg-card/40 p-3 text-xs">
            <div className="mb-2 font-semibold text-foreground">Opções</div>
            <div className="space-y-2">
              <label className="flex items-start gap-2 opacity-70">
                <Checkbox checked disabled />
                <div>
                  <div className="font-medium text-foreground">Limpar itens do inventário</div>
                  <div className="text-[11px] text-muted-foreground">
                    Sempre aplicado. Cada slot vira <span className="font-mono">id=0, count=0</span>.
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox
                  checked={clearMoney}
                  onCheckedChange={(v) => setClearMoney(Boolean(v))}
                  disabled={running}
                />
                <div>
                  <div className="font-medium text-foreground">Limpar dinheiro do inventário</div>
                  <div className="text-[11px] text-muted-foreground">
                    Zera <span className="font-mono">inventory.money</span>. Default desligado.
                  </div>
                </div>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox
                  checked={removeOutOfCapacity}
                  onCheckedChange={(v) => setRemoveOutOfCapacity(Boolean(v))}
                  disabled={running}
                />
                <div>
                  <div className="font-medium text-foreground">
                    Remover slots fora da capacidade
                    {totalOOC > 0 && (
                      <span className="ml-1 rounded bg-warning/20 px-1.5 py-0.5 font-mono text-[10px] text-warning">
                        {totalOOC} detectado(s)
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Default: preservar (slots com <span className="font-mono">pos ≥ capacity</span> ficam zerados, mas continuam no payload).
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Preview de alvos */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Alvos ({targets.length}) — itens preenchidos hoje: {totalFilled}
              </span>
              {finished && (
                <span className="text-[11px] text-muted-foreground">
                  ✓ {summary.ok} · ⏭ {summary.skipped} · ✕ {summary.error}
                </span>
              )}
            </div>
            <ScrollArea className="h-[240px] rounded-md border border-border bg-background/30">
              <ul className="divide-y divide-border/40">
                {targets.map((t) => {
                  const r = results[t.roleid];
                  return (
                    <li
                      key={t.roleid}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-card/40"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-foreground">{t.name}</span>{" "}
                        <span className="text-muted-foreground">· {t.className}</span>
                        <div className="font-mono text-[10px] text-muted-foreground">
                          roleid {t.roleid} · cls {t.cls} · {t.filled} item(ns)
                          {t.ooc > 0 && ` · ${t.ooc} fora da capacidade`}
                        </div>
                      </div>
                      {r?.status === "running" && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      )}
                      {r?.status === "ok" && (
                        <span className="flex items-center gap-1 text-success">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="text-[10px]">limpo</span>
                        </span>
                      )}
                      {r?.status === "skipped" && (
                        <span
                          className="flex items-center gap-1 text-warning"
                          title={r.message}
                        >
                          <Info className="h-3.5 w-3.5" />
                          <span className="max-w-[180px] truncate text-[10px]">
                            {r.message ?? "ignorado"}
                          </span>
                        </span>
                      )}
                      {r?.status === "error" && (
                        <span
                          className="flex items-center gap-1 text-destructive"
                          title={r.message}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span className="max-w-[180px] truncate text-[10px]">
                            {r.message}
                          </span>
                        </span>
                      )}
                    </li>
                  );
                })}
                {targets.length === 0 && (
                  <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                    Nenhum template carregado.
                  </li>
                )}
              </ul>
            </ScrollArea>
          </div>

          {/* Backups gerados — só aparece após executar */}
          {finished && summary.ok > 0 && (
            <div className="rounded-md border border-border bg-card/40 p-3 text-xs">
              <div className="mb-2 font-semibold text-foreground">
                Backups gerados pela API
              </div>
              <ScrollArea className="max-h-[140px]">
                <ul className="space-y-1 font-mono text-[10px] text-muted-foreground">
                  {Object.values(results)
                    .filter((r) => r.status === "ok")
                    .map((r) => (
                      <li key={r.roleid} className="border-l-2 border-primary/40 pl-2">
                        <span className="font-bold text-foreground">roleid {r.roleid}</span>
                        {r.gamedbdBackup && <div>gamedbd: {r.gamedbdBackup}</div>}
                        {r.backupRoleJson && <div>role_json: {r.backupRoleJson}</div>}
                        {r.backupClsconfigFile && <div>clsconfig: {r.backupClsconfigFile}</div>}
                        {r.exportLogFile && <div>export_log: {r.exportLogFile}</div>}
                      </li>
                    ))}
                </ul>
              </ScrollArea>
            </div>
          )}

          {/* Confirmação forte */}
          {!finished && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                Confirmação obrigatória
              </div>
              <Label className="mb-1 block text-[11px] text-muted-foreground">
                Para prosseguir, digite exatamente:{" "}
                <span className="font-mono font-bold text-destructive">{CONFIRM_PHRASE}</span>
              </Label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                disabled={running}
                placeholder={CONFIRM_PHRASE}
                className="font-mono text-xs"
                autoComplete="off"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={running}
          >
            {finished ? "Fechar" : "Cancelar"}
          </Button>
          {!finished && (
            <Button
              variant="destructive"
              onClick={run}
              disabled={!canRun}
              title={!phraseOk ? "Digite a frase de confirmação" : undefined}
            >
              {running ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Eraser className="h-4 w-4" />
              )}
              {running
                ? `Limpando... (${summary.ok + summary.error + summary.skipped}/${targets.length})`
                : `Limpar inventário em ${targets.length} CLS`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
