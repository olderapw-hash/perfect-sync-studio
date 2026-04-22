import { useEffect, useState } from "react";
import {
  Archive,
  Loader2,
  RefreshCw,
  AlertCircle,
  FileJson,
  FileBox,
  FileText,
  Lock,
  RotateCcw,
  ShieldAlert,
  GitCompareArrows,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useSeenBackups, type SeenBackup } from "@/lib/seenBackups";
import {
  pwApi,
  EndpointMissingError,
  type BackupRecord,
  type BackupKind,
  type RestoreBackupResponse,
} from "@/lib/pwApiActions";
import { toast } from "sonner";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { CompareBackupDialog } from "./CompareBackupDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Disparado após restore real bem-sucedido — usado pra recarregar getClsconfig. */
  onRestored?: () => void;
}

const fmtDate = (ts: number) => new Date(ts).toLocaleString("pt-BR");

const resolveCreatedMs = (b: BackupRecord): number | null => {
  if (b.created_at) {
    const t = Date.parse(b.created_at);
    if (!Number.isNaN(t)) return t;
  }
  if (b.mtime != null && Number.isFinite(b.mtime)) return b.mtime * 1000;
  return null;
};
const fmtCreated = (b: BackupRecord) => {
  const ms = resolveCreatedMs(b);
  return ms != null ? new Date(ms).toLocaleString("pt-BR") : "—";
};

const fmtBytes = (n?: number) => {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

const basename = (p: string) => {
  const i = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return i >= 0 ? p.slice(i + 1) : p;
};
const fileLabel = (b: BackupRecord) => b.name || basename(b.file);

interface VpsBuckets {
  all: BackupRecord[];
  role_json: BackupRecord[];
  clsconfig_files: BackupRecord[];
  export_logs: BackupRecord[];
}

const emptyBuckets: VpsBuckets = { all: [], role_json: [], clsconfig_files: [], export_logs: [] };

type RestoreStage =
  | { phase: "idle" }
  | { phase: "dryrun"; backup: BackupRecord }
  | { phase: "confirm"; backup: BackupRecord; dry: RestoreBackupResponse }
  | { phase: "running"; backup: BackupRecord }
  | { phase: "done"; backup: BackupRecord; result: RestoreBackupResponse };

export const BackupsDialog = ({ open, onOpenChange, onRestored }: Props) => {
  const seen = useSeenBackups();
  const [vps, setVps] = useState<VpsBuckets>(emptyBuckets);
  const [loading, setLoading] = useState(false);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [restore, setRestore] = useState<RestoreStage>({ phase: "idle" });
  const [compareTarget, setCompareTarget] = useState<BackupRecord | null>(null);

  const loadVps = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pwApi.listBackups({ limit: 50 });
      const b = res?.backups ?? {};
      const tag = (arr: BackupRecord[] | undefined, kind: BackupKind): BackupRecord[] =>
        Array.isArray(arr) ? arr.map((r) => ({ ...r, type: r.type ?? kind })) : [];
      const role_json = tag(b.role_json, "role_json");
      const clsconfig_files = tag(b.clsconfig_files, "clsconfig_file");
      const export_logs = tag(b.export_logs, "export_log");
      const sortKey = (r: BackupRecord) =>
        r.mtime ?? (r.created_at ? Date.parse(r.created_at) / 1000 : 0);
      const sortDesc = (arr: BackupRecord[]) => [...arr].sort((x, y) => sortKey(y) - sortKey(x));
      const all = Array.isArray(b.all) && b.all.length > 0
        ? sortDesc(b.all)
        : sortDesc([...role_json, ...clsconfig_files, ...export_logs]);
      setVps({ all, role_json, clsconfig_files, export_logs });
      setEndpointMissing(false);
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
        setVps(emptyBuckets);
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void loadVps();
    } else {
      // Limpa estado de restore ao fechar.
      setRestore({ phase: "idle" });
    }
  }, [open]);

  // ----- Restore disabled toast (clsconfig_file / export_log) -----
  const handleRestoreUnsupported = (kind: BackupKind) => {
    if (kind === "export_log") {
      toast.warning("Export log não é restaurável", {
        description: "Logs de exportClsconfig não contêm estado para restaurar.",
      });
      return;
    }
    toast.warning("Restaurar clsconfig_file ainda não habilitado", {
      description:
        "No momento apenas backups type=role_json podem ser restaurados via restoreBackup.",
      duration: 6000,
    });
  };

  // ----- Restore real (apenas role_json) -----
  const beginRestore = async (backup: BackupRecord) => {
    if (backup.type !== "role_json") {
      handleRestoreUnsupported(backup.type);
      return;
    }
    if (!backup.name && !backup.file) {
      toast.error("Backup sem 'name' — não é possível restaurar.");
      return;
    }
    const name = backup.name || basename(backup.file);
    setRestore({ phase: "dryrun", backup });
    try {
      const dry = await pwApi.restoreBackup({ type: "role_json", name, dry_run: true });
      if (!dry?.success) {
        const msg = dry?.error || "dry_run retornou success:false";
        toast.error("Dry-run rejeitado", { description: msg });
        setRestore({ phase: "idle" });
        return;
      }
      setRestore({ phase: "confirm", backup, dry });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Falha no dry_run", { description: msg });
      setRestore({ phase: "idle" });
    }
  };

  const confirmRestore = async () => {
    if (restore.phase !== "confirm") return;
    const { backup } = restore;
    const name = backup.name || basename(backup.file);
    setRestore({ phase: "running", backup });
    try {
      const res = await pwApi.restoreBackup({
        type: "role_json",
        name,
        confirm: "RESTORE_ROLE_JSON",
      });
      if (!res?.success) {
        const msg = res?.error || "Restore retornou success:false";
        toast.error("Restore falhou", { description: msg });
        setRestore({ phase: "idle" });
        return;
      }
      const verified = res.restored?.saved?.verified ?? res.verified;
      toast.success(
        verified
          ? `Restore aplicado e verificado (roleid ${res.roleid ?? backup.roleid ?? "?"})`
          : `Restore aplicado (roleid ${res.roleid ?? backup.roleid ?? "?"}) — verificação não confirmada`,
        { duration: 7000 },
      );
      setRestore({ phase: "done", backup, result: res });
      // Recarrega listagem de backups (tem 2 backups novos: pre + clsconfig_file)
      void loadVps();
      // Recarrega o getClsconfig do app
      onRestored?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Falha no restore", { description: msg });
      setRestore({ phase: "idle" });
    }
  };

  const cancelConfirm = () => setRestore({ phase: "idle" });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-primary" />
              Backups & Restore
            </DialogTitle>
            <DialogDescription>
              Restaurar habilitado apenas para <code className="font-mono">role_json</code>. Faz{" "}
              <code className="font-mono">dry_run</code> primeiro e exige confirmação explícita.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="vps" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="vps">
                VPS {endpointMissing ? "(indisponível)" : `(${vps.all.length})`}
              </TabsTrigger>
              <TabsTrigger value="session">
                Esta sessão ({seen.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vps">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Listagem real do diretório <code className="font-mono">backups/clsconfig/</code> via{" "}
                  <code className="font-mono">action=listBackups</code>.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadVps}
                  disabled={loading || endpointMissing}
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Recarregar
                </Button>
              </div>

              {endpointMissing ? (
                <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-warning">
                    <AlertCircle className="h-4 w-4" />
                    Endpoint listBackups ainda não implementado
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Use a aba "Esta sessão" enquanto isso.
                  </p>
                </div>
              ) : error ? (
                <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                  {error}
                </div>
              ) : (
                <Tabs defaultValue="all">
                  <TabsList className="mb-2">
                    <TabsTrigger value="all">Todos ({vps.all.length})</TabsTrigger>
                    <TabsTrigger value="role_json">role_json ({vps.role_json.length})</TabsTrigger>
                    <TabsTrigger value="clsconfig_files">clsconfig ({vps.clsconfig_files.length})</TabsTrigger>
                    <TabsTrigger value="export_logs">exports ({vps.export_logs.length})</TabsTrigger>
                  </TabsList>
                  <TabsContent value="all">
                    <VpsList items={vps.all} onRestore={beginRestore} onUnsupported={handleRestoreUnsupported} onCompare={setCompareTarget} restoringName={restoringName(restore)} />
                  </TabsContent>
                  <TabsContent value="role_json">
                    <VpsList items={vps.role_json} onRestore={beginRestore} onUnsupported={handleRestoreUnsupported} onCompare={setCompareTarget} restoringName={restoringName(restore)} />
                  </TabsContent>
                  <TabsContent value="clsconfig_files">
                    <VpsList items={vps.clsconfig_files} onRestore={beginRestore} onUnsupported={handleRestoreUnsupported} onCompare={setCompareTarget} restoringName={restoringName(restore)} />
                  </TabsContent>
                  <TabsContent value="export_logs">
                    <VpsList items={vps.export_logs} onRestore={beginRestore} onUnsupported={handleRestoreUnsupported} onCompare={setCompareTarget} restoringName={restoringName(restore)} hideRestore />
                  </TabsContent>
                </Tabs>
              )}
            </TabsContent>

            <TabsContent value="session">
              <p className="mb-2 text-xs text-muted-foreground">
                Coletados a partir das respostas de save desta sessão. Não persiste após fechar a aba.
              </p>
              <SessionList items={seen} />
            </TabsContent>
          </Tabs>

          {restore.phase === "done" && <RestoreResult result={restore.result} />}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm dialog (após dry_run OK) */}
      <AlertDialog
        open={restore.phase === "confirm" || restore.phase === "running"}
        onOpenChange={(o) => {
          if (!o && restore.phase === "confirm") cancelConfirm();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Confirmar restore de role_json
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                {restore.phase === "confirm" && (
                  <>
                    <p>
                      Restaurar backup do{" "}
                      <strong>roleid {restore.dry.roleid ?? restore.backup.roleid ?? "?"}</strong>?
                      Isso vai aplicar o JSON no{" "}
                      <code className="font-mono">gamedbd</code>, criar novo backup de segurança e
                      agendar <code className="font-mono">exportclsconfig</code>.
                    </p>
                    <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
                      <div className="font-semibold text-foreground">Backup escolhido:</div>
                      <div className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
                        {restore.backup.name || basename(restore.backup.file)}
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        Criado em {fmtCreated(restore.backup)} — {fmtBytes(restore.backup.bytes)}
                      </div>
                    </div>
                    <p className="text-xs text-warning">
                      Antes de restaurar, o servidor já gera um novo backup do estado atual.
                    </p>
                  </>
                )}
                {restore.phase === "running" && (
                  <p className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Aplicando restore…
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restore.phase === "running"}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmRestore();
              }}
              disabled={restore.phase === "running"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {restore.phase === "running" ? "Aplicando…" : "Sim, restaurar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CompareBackupDialog
        open={compareTarget !== null}
        onOpenChange={(o) => {
          if (!o) setCompareTarget(null);
        }}
        backup={compareTarget}
        onRestored={() => {
          void loadVps();
          onRestored?.();
        }}
      />
    </>
  );
};

const restoringName = (r: RestoreStage): string | null => {
  if (r.phase === "dryrun" || r.phase === "running") {
    return r.backup.name || basename(r.backup.file);
  }
  return null;
};

const RestoreResult = ({ result }: { result: RestoreBackupResponse }) => {
  const saved = result.restored?.saved;
  const verified = saved?.verified ?? result.verified;
  const roleJson = saved?.backups?.role_json?.file;
  const clsFile = saved?.backups?.clsconfig_file?.file;
  const exportLog = saved?.export?.log_file;
  return (
    <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-xs">
      <div className="mb-2 flex items-center gap-2 font-semibold text-success">
        <RotateCcw className="h-4 w-4" />
        Restore aplicado{verified ? " (verificado)" : " (não verificado)"} — roleid {result.roleid}
      </div>
      <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
        {roleJson && <div>role_json: {roleJson}</div>}
        {clsFile && <div>clsconfig_file: {clsFile}</div>}
        {exportLog && <div>export.log: {exportLog}</div>}
        {!roleJson && !clsFile && !exportLog && <div>Sem detalhes adicionais retornados.</div>}
      </div>
    </div>
  );
};

const RestoreButton = ({
  onClick,
  disabled,
  loading,
  title,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  title?: string;
}) => (
  <Button
    size="sm"
    variant={disabled ? "outline" : "destructive"}
    disabled={disabled || loading}
    onClick={onClick}
    title={title}
    className={disabled ? "cursor-not-allowed" : ""}
  >
    {loading ? (
      <Loader2 className="h-3 w-3 animate-spin" />
    ) : disabled ? (
      <Lock className="h-3 w-3" />
    ) : (
      <RotateCcw className="h-3 w-3" />
    )}
    Restaurar
  </Button>
);

const TypeIcon = ({ type }: { type: SeenBackup["type"] | BackupKind }) => {
  if (type === "role_json") return <FileJson className="h-3.5 w-3.5 text-primary" />;
  if (type === "export_log") return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
  return <FileBox className="h-3.5 w-3.5 text-secondary-foreground" />;
};

const SessionList = ({ items }: { items: SeenBackup[] }) => {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        Nenhum backup gerado nesta sessão. Faça um save para começar.
      </p>
    );
  }
  return (
    <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/60 backdrop-blur">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Roleid</th>
            <th className="px-3 py-2 font-medium">Quando</th>
            <th className="px-3 py-2 font-medium">Arquivo</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((b) => (
            <tr key={b.id} className="hover:bg-muted/30">
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1.5">
                  <TypeIcon type={b.type} />
                  {b.type}
                </span>
              </td>
              <td className="px-3 py-2 font-mono">{b.roleid}</td>
              <td className="px-3 py-2 text-muted-foreground">{fmtDate(b.ts)}</td>
              <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground" title={b.file}>
                …{b.file.slice(-50)}
              </td>
              <td className="px-3 py-2 text-right text-[10px] text-muted-foreground">
                use a aba VPS
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const VpsList = ({
  items,
  onRestore,
  onUnsupported,
  onCompare,
  restoringName,
  hideRestore,
}: {
  items: BackupRecord[];
  onRestore: (b: BackupRecord) => void;
  onUnsupported: (k: BackupKind) => void;
  onCompare: (b: BackupRecord) => void;
  restoringName: string | null;
  hideRestore?: boolean;
}) => {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        Nenhum backup retornado pela VPS.
      </p>
    );
  }
  return (
    <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/60 backdrop-blur">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Roleid</th>
            <th className="px-3 py-2 font-medium">Criado</th>
            <th className="px-3 py-2 font-medium">Tam.</th>
            <th className="px-3 py-2 font-medium">Arquivo</th>
            {!hideRestore && <th className="px-3 py-2"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((b, i) => {
            const isRoleJson = b.type === "role_json";
            const name = b.name || basename(b.file);
            const isLoading = restoringName !== null && restoringName === name;
            const tip = isRoleJson
              ? "Restaurar este snapshot de role_json"
              : b.type === "export_log"
                ? "Logs de export não são restauráveis"
                : "Restore de clsconfig_file ainda não habilitado";
            return (
              <tr key={`${b.file}-${i}`} className="hover:bg-muted/30">
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <TypeIcon type={b.type} />
                    {b.type}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono">{b.roleid ?? "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{fmtCreated(b)}</td>
                <td className="px-3 py-2 text-muted-foreground">{fmtBytes(b.bytes)}</td>
                <td
                  className="px-3 py-2 font-mono text-[10px] text-muted-foreground"
                  title={b.file}
                >
                  {name}
                </td>
                {!hideRestore && (
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {isRoleJson && b.roleid != null && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onCompare(b)}
                          title="Comparar com estado atual e restaurar por seção"
                        >
                          <GitCompareArrows className="h-3 w-3" />
                          Comparar
                        </Button>
                      )}
                      <RestoreButton
                        onClick={() =>
                          isRoleJson ? onRestore(b) : onUnsupported(b.type)
                        }
                        disabled={!isRoleJson}
                        loading={isLoading}
                        title={tip}
                      />
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
