import { useEffect, useMemo, useState } from "react";
import {
  History,
  Loader2,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  ShieldAlert,
  GitCompareArrows,
  FileJson,
  ChevronRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import {
  pwApi,
  EndpointMissingError,
  type BackupRecord,
  type RestoreBackupResponse,
} from "@/lib/pwApiActions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CompareBackupDialog } from "./CompareBackupDialog";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  roleid: number;
  className?: string;
  /** Disparado após restore bem-sucedido (parcial ou total) — recarrega editor. */
  onRestored?: () => void;
}

const basename = (p: string) => {
  const i = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return i >= 0 ? p.slice(i + 1) : p;
};

const fmtBytes = (n?: number) => {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

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

/** Tenta extrair o template do backup, tolerando wrappers. */
const extractTemplate = (raw: unknown): Record<string, unknown> | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.template && typeof r.template === "object") return r.template as Record<string, unknown>;
  if (r.role && typeof r.role === "object") {
    const role = r.role as Record<string, unknown>;
    if (role.template && typeof role.template === "object") return role.template as Record<string, unknown>;
    return role;
  }
  if (r.status || r.inventory || r.equipment || r.storehouse || r.base) return r;
  return null;
};

const countItems = (section: unknown, key: string): number => {
  const s = section as Record<string, unknown> | null | undefined;
  const arr = s?.[key];
  if (Array.isArray(arr)) {
    return arr.filter((it) => {
      const o = it as { id?: number };
      return (o?.id ?? 0) > 0;
    }).length;
  }
  return 0;
};

interface BackupSummary {
  status: { level?: number; level2?: number; reputation?: number; hp?: number; mp?: number; posx?: number; posy?: number; posz?: number };
  inventory: { money?: number; capacity?: number; itemCount: number };
  equipment: { itemCount: number };
  storehouse: { money?: number; capacity?: number; itemCount: number };
  changedSections: string[];
}

const buildSummary = (
  bTpl: Record<string, unknown> | null,
  cTpl: Record<string, unknown> | null,
): BackupSummary => {
  const bStatus = (bTpl?.status as Record<string, unknown> | undefined) ?? {};
  const bInv = (bTpl?.inventory as Record<string, unknown> | undefined) ?? {};
  const bEq = (bTpl?.equipment as Record<string, unknown> | undefined) ?? {};
  const bSh = (bTpl?.storehouse as Record<string, unknown> | undefined) ?? {};

  const summary: BackupSummary = {
    status: {
      level: bStatus.level as number | undefined,
      level2: bStatus.level2 as number | undefined,
      reputation: bStatus.reputation as number | undefined,
      hp: bStatus.hp as number | undefined,
      mp: bStatus.mp as number | undefined,
      posx: bStatus.posx as number | undefined,
      posy: bStatus.posy as number | undefined,
      posz: bStatus.posz as number | undefined,
    },
    inventory: {
      money: bInv.money as number | undefined,
      capacity: bInv.capacity as number | undefined,
      itemCount: countItems(bInv, "items"),
    },
    equipment: {
      itemCount: countItems(bEq, "items"),
    },
    storehouse: {
      money: bSh.money as number | undefined,
      capacity: bSh.capacity as number | undefined,
      itemCount:
        countItems(bSh, "items") +
        countItems(bSh, "dress") +
        countItems(bSh, "material") +
        countItems(bSh, "generalcard"),
    },
    changedSections: [],
  };

  if (!cTpl) return summary;
  const cStatus = (cTpl.status as Record<string, unknown> | undefined) ?? {};
  const cInv = (cTpl.inventory as Record<string, unknown> | undefined) ?? {};
  const cEq = (cTpl.equipment as Record<string, unknown> | undefined) ?? {};
  const cSh = (cTpl.storehouse as Record<string, unknown> | undefined) ?? {};

  const statusFields = ["level", "level2", "reputation", "hp", "mp", "exp", "sp", "posx", "posy", "posz"];
  if (statusFields.some((f) => JSON.stringify(bStatus[f]) !== JSON.stringify(cStatus[f]))) {
    summary.changedSections.push("status");
  }
  if (
    bInv.money !== cInv.money ||
    bInv.capacity !== cInv.capacity ||
    countItems(bInv, "items") !== countItems(cInv, "items")
  ) {
    summary.changedSections.push("inventory");
  }
  if (countItems(bEq, "items") !== countItems(cEq, "items")) {
    summary.changedSections.push("equipment");
  }
  if (
    bSh.money !== cSh.money ||
    bSh.capacity !== cSh.capacity ||
    summary.storehouse.itemCount !==
      countItems(cSh, "items") + countItems(cSh, "dress") + countItems(cSh, "material") + countItems(cSh, "generalcard")
  ) {
    summary.changedSections.push("storehouse");
  }
  return summary;
};

interface DetailState {
  loading: boolean;
  error: string | null;
  backupTpl: Record<string, unknown> | null;
  currentTpl: Record<string, unknown> | null;
  online: boolean;
  summary: BackupSummary | null;
}

const emptyDetail: DetailState = {
  loading: false,
  error: null,
  backupTpl: null,
  currentTpl: null,
  online: false,
  summary: null,
};

export const RoleidHistoryDialog = ({
  open,
  onOpenChange,
  roleid,
  className,
  onRestored,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [items, setItems] = useState<BackupRecord[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailState>(emptyDetail);

  // Comparison sub-dialog (reusa o CompareBackupDialog completo).
  const [compareTarget, setCompareTarget] = useState<BackupRecord | null>(null);

  // Confirmação de restore total via restoreBackup.
  const [confirmFullRestore, setConfirmFullRestore] = useState<BackupRecord | null>(null);
  const [runningFullRestore, setRunningFullRestore] = useState(false);
  const [lastFullResult, setLastFullResult] = useState<RestoreBackupResponse | null>(null);

  // Confirmação de restore parcial (seção isolada) via saveRoleEditable.
  const [confirmSection, setConfirmSection] = useState<{
    section: "status" | "inventory" | "equipment" | "storehouse";
    backup: BackupRecord;
  } | null>(null);
  const [runningSection, setRunningSection] = useState(false);

  const loadList = async () => {
    setLoading(true);
    setListError(null);
    try {
      const res = await pwApi.listBackups({ roleid, limit: 100 });
      const arr = res?.backups?.role_json ?? [];
      const tagged = arr.map((r) => ({ ...r, type: r.type ?? ("role_json" as const) }));
      // Filtra extra por roleid (caso a VPS ignore o param).
      const filtered = tagged.filter((b) => b.roleid == null || b.roleid === roleid);
      const sortKey = (r: BackupRecord) =>
        r.mtime ?? (r.created_at ? Date.parse(r.created_at) / 1000 : 0);
      const sorted = [...filtered].sort((a, b) => sortKey(b) - sortKey(a));
      setItems(sorted);
      setEndpointMissing(false);
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
        setItems([]);
      } else {
        setListError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (backup: BackupRecord) => {
    setDetail({ ...emptyDetail, loading: true });
    const name = backup.name || basename(backup.file);
    try {
      // Carrega backup content via POST JSON. Fallback dry_run só se 404/missing.
      let bTpl: Record<string, unknown> | null = null;
      try {
        const bc = await pwApi.getBackupContent(name, "role_json");
        if (!bc?.success) throw new Error(bc?.error || "getBackupContent retornou success:false");
        // Shape novo: bc.backup.template. Legado: bc.template / bc.role.
        const raw = bc.backup?.template ?? bc.template ?? bc.role;
        bTpl = extractTemplate(raw);
        if (!bTpl) {
          throw new Error("getBackupContent respondeu success mas sem backup.template.");
        }
      } catch (e) {
        if (e instanceof EndpointMissingError) {
          const dry = await pwApi.restoreBackup({ type: "role_json", name, dry_run: true });
          if (!dry?.success) throw new Error(dry?.error || "dry_run retornou success:false");
          bTpl = extractTemplate(dry.source);
          if (!bTpl) {
            throw new Error(
              "VPS não retornou conteúdo do backup (nem getBackupContent nem dry_run.source).",
            );
          }
        } else {
          throw e;
        }
      }

      // Carrega estado atual do role real.
      const cur = await pwApi.getRoleEditable(roleid);
      if (!cur?.success) throw new Error(cur?.error || "getRoleEditable retornou success:false");
      const cTpl = extractTemplate(cur.template ?? cur.role);

      const summary = buildSummary(bTpl, cTpl);
      setDetail({
        loading: false,
        error: null,
        backupTpl: bTpl,
        currentTpl: cTpl,
        online: Boolean(cur.online),
        summary,
      });
    } catch (e) {
      setDetail({
        ...emptyDetail,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  useEffect(() => {
    if (open && roleid != null) {
      void loadList();
      setSelectedFile(null);
      setDetail(emptyDetail);
      setLastFullResult(null);
    }
    if (!open) {
      setItems([]);
      setSelectedFile(null);
      setDetail(emptyDetail);
      setConfirmFullRestore(null);
      setConfirmSection(null);
      setLastFullResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, roleid]);

  const selectedBackup = useMemo(
    () => items.find((b) => b.file === selectedFile) ?? null,
    [items, selectedFile],
  );

  const handleSelect = (b: BackupRecord) => {
    setSelectedFile(b.file);
    void loadDetail(b);
  };

  const performFullRestore = async () => {
    if (!confirmFullRestore) return;
    const name = confirmFullRestore.name || basename(confirmFullRestore.file);
    setRunningFullRestore(true);
    try {
      const res = await pwApi.restoreBackup({
        type: "role_json",
        name,
        confirm: "RESTORE_ROLE_JSON",
      });
      if (!res?.success) {
        toast.error("Restore falhou", { description: res?.error || "success:false" });
        setConfirmFullRestore(null);
        return;
      }
      const verified = res.restored?.saved?.verified ?? res.verified;
      toast.success(
        verified
          ? `Backup restaurado e verificado (roleid ${res.roleid ?? roleid})`
          : `Backup restaurado (roleid ${res.roleid ?? roleid}) — verificação não confirmada`,
        { duration: 7000 },
      );
      setLastFullResult(res);
      setConfirmFullRestore(null);
      void loadList();
      if (selectedBackup) void loadDetail(selectedBackup);
      onRestored?.();
    } catch (e) {
      toast.error("Falha no restore total", {
        description: e instanceof Error ? e.message : String(e),
      });
      setConfirmFullRestore(null);
    } finally {
      setRunningFullRestore(false);
    }
  };

  const performSectionRestore = async () => {
    if (!confirmSection || !detail.backupTpl) return;
    const { section, backup } = confirmSection;
    const sectionPayload = detail.backupTpl[section];
    if (sectionPayload == null) {
      toast.error(`Backup não contém a seção '${section}'.`);
      setConfirmSection(null);
      return;
    }
    setRunningSection(true);
    try {
      const payload = {
        roleid,
        [section]: sectionPayload,
      } as Parameters<typeof pwApi.saveRoleEditable>[0];
      const res = await pwApi.saveRoleEditable(payload);
      if (!res?.success) {
        toast.error(`Restauração de '${section}' falhou`, {
          description: res?.error || "saveRoleEditable retornou success:false",
        });
        setConfirmSection(null);
        return;
      }
      const verified = res.saved?.verified ?? res.verified;
      toast.success(
        verified
          ? `Seção '${section}' restaurada e verificada (roleid ${roleid})`
          : `Seção '${section}' restaurada (roleid ${roleid}) — verificação não confirmada`,
        { duration: 6000 },
      );
      setConfirmSection(null);
      void loadList();
      void loadDetail(backup);
      onRestored?.();
    } catch (e) {
      toast.error("Falha na restauração", {
        description: e instanceof Error ? e.message : String(e),
      });
      setConfirmSection(null);
    } finally {
      setRunningSection(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Histórico de alterações — roleid {roleid}
              {className && <span className="text-xs text-muted-foreground">· {className}</span>}
            </DialogTitle>
            <DialogDescription>
              Backups <code className="font-mono">role_json</code> existentes na VPS para este
              roleid. Restauração de <code className="font-mono">clsconfig_file</code> não é
              permitida aqui.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {endpointMissing
                ? "Endpoint listBackups indisponível."
                : `${items.length} backup(s) encontrado(s).`}
            </p>
            <Button variant="outline" size="sm" onClick={loadList} disabled={loading || endpointMissing}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Recarregar
            </Button>
          </div>

          {endpointMissing ? (
            <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
              <div className="flex items-center gap-2 font-semibold text-warning">
                <AlertCircle className="h-4 w-4" />
                Endpoint listBackups ainda não implementado na VPS.
              </div>
            </div>
          ) : listError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              {listError}
            </div>
          ) : items.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Nenhum backup role_json para este roleid.
            </p>
          ) : (
            <div className="grid grid-cols-12 gap-3">
              {/* Lista esquerda */}
              <div className="col-span-12 max-h-[55vh] overflow-y-auto rounded-md border border-border md:col-span-5">
                <ul className="divide-y divide-border">
                  {items.map((b) => {
                    const sel = b.file === selectedFile;
                    return (
                      <li key={b.file}>
                        <button
                          type="button"
                          onClick={() => handleSelect(b)}
                          className={cn(
                            "flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-xs transition hover:bg-muted/40",
                            sel && "bg-primary/10 hover:bg-primary/15",
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <FileJson className="h-3 w-3 shrink-0 text-primary" />
                              <span className="truncate font-mono text-[10px] text-muted-foreground">
                                {b.name || basename(b.file)}
                              </span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{fmtCreated(b)}</span>
                              <span>·</span>
                              <span>{fmtBytes(b.bytes)}</span>
                            </div>
                          </div>
                          {sel && <ChevronRight className="h-3 w-3 shrink-0 text-primary" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Detalhe direita */}
              <div className="col-span-12 max-h-[55vh] overflow-y-auto md:col-span-7">
                {!selectedBackup ? (
                  <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    Selecione um backup à esquerda para ver o resumo.
                  </p>
                ) : detail.loading ? (
                  <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
                  </div>
                ) : detail.error ? (
                  <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertCircle className="h-4 w-4" /> Erro
                    </div>
                    <p className="mt-1 whitespace-pre-wrap">{detail.error}</p>
                  </div>
                ) : (
                  <DetailPanel
                    backup={selectedBackup}
                    detail={detail}
                    onCompare={() => setCompareTarget(selectedBackup)}
                    onFullRestore={() => setConfirmFullRestore(selectedBackup)}
                    onSectionRestore={(section) =>
                      setConfirmSection({ section, backup: selectedBackup })
                    }
                  />
                )}
              </div>
            </div>
          )}

          {lastFullResult && (
            <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-xs">
              <div className="mb-1 flex items-center gap-2 font-semibold text-success">
                <RotateCcw className="h-4 w-4" />
                Restore total aplicado — roleid {lastFullResult.roleid}
              </div>
              <div className="space-y-0.5 font-mono text-[10px] text-muted-foreground">
                {lastFullResult.restored?.saved?.backups?.role_json?.file && (
                  <div>role_json: {lastFullResult.restored.saved.backups.role_json.file}</div>
                )}
                {lastFullResult.restored?.saved?.backups?.clsconfig_file?.file && (
                  <div>clsconfig_file: {lastFullResult.restored.saved.backups.clsconfig_file.file}</div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sub-dialog: comparação detalhada por seção */}
      <CompareBackupDialog
        open={compareTarget !== null}
        onOpenChange={(o) => {
          if (!o) setCompareTarget(null);
        }}
        backup={compareTarget}
        onRestored={() => {
          void loadList();
          if (selectedBackup) void loadDetail(selectedBackup);
          onRestored?.();
        }}
      />

      {/* Confirmação: restore total */}
      <AlertDialog
        open={confirmFullRestore !== null}
        onOpenChange={(o) => {
          if (!o && !runningFullRestore) setConfirmFullRestore(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Restaurar backup INTEIRO
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  Restaurar o backup completo do <strong>roleid {roleid}</strong>?
                </p>
                <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
                  <div className="break-all font-mono text-[11px] text-muted-foreground">
                    {confirmFullRestore?.name || (confirmFullRestore && basename(confirmFullRestore.file))}
                  </div>
                </div>
                <p className="text-xs text-warning">
                  A VPS gera um novo backup do estado atual antes de aplicar e dispara
                  exportclsconfig automaticamente. Personagem deve estar offline.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={runningFullRestore}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void performFullRestore();
              }}
              disabled={runningFullRestore}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {runningFullRestore ? "Aplicando…" : "Sim, restaurar tudo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmação: restore de seção */}
      <AlertDialog
        open={confirmSection !== null}
        onOpenChange={(o) => {
          if (!o && !runningSection) setConfirmSection(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Restaurar seção
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  Restaurar <strong>somente {confirmSection?.section}</strong> do backup para{" "}
                  <strong>roleid {roleid}</strong>?
                </p>
                <p className="text-xs text-warning">
                  Outras seções não serão tocadas. Personagem deve estar offline.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={runningSection}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void performSectionRestore();
              }}
              disabled={runningSection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {runningSection ? "Aplicando…" : `Sim, restaurar ${confirmSection?.section}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const DetailPanel = ({
  backup,
  detail,
  onCompare,
  onFullRestore,
  onSectionRestore,
}: {
  backup: BackupRecord;
  detail: DetailState;
  onCompare: () => void;
  onFullRestore: () => void;
  onSectionRestore: (section: "status" | "inventory" | "equipment" | "storehouse") => void;
}) => {
  const s = detail.summary;
  if (!s) return null;
  const changed = new Set(s.changedSections);
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-card/40 p-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="font-semibold text-foreground">{backup.name || basename(backup.file)}</div>
          {detail.online && (
            <span className="inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-bold text-warning">
              <ShieldAlert className="h-3 w-3" /> ONLINE
            </span>
          )}
        </div>
        <div className="mt-1 text-[11px] text-muted-foreground">
          {fmtCreated(backup)} · {fmtBytes(backup.bytes)}
        </div>
        {s.changedSections.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <span className="text-[10px] text-muted-foreground">Seções alteradas:</span>
            {s.changedSections.map((sec) => (
              <span
                key={sec}
                className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10px] text-primary"
              >
                {sec}
              </span>
            ))}
          </div>
        ) : (
          <div className="mt-2 text-[10px] text-success">
            Backup idêntico ao estado atual (ou diferenças não detectadas no resumo).
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={onCompare}>
          <GitCompareArrows className="h-3 w-3" />
          Comparar
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onFullRestore}
          disabled={detail.online}
          title={detail.online ? "Personagem online — bloqueado" : "Restaurar backup inteiro"}
        >
          <RotateCcw className="h-3 w-3" />
          Restaurar tudo
        </Button>
      </div>

      <SectionCard
        title="Status"
        highlighted={changed.has("status")}
        onRestore={() => onSectionRestore("status")}
        disabled={detail.online}
        rows={[
          ["fama", s.status.reputation],
          ["level", s.status.level],
          ["cultivo (level2)", s.status.level2],
          ["hp", s.status.hp],
          ["mp", s.status.mp],
          [
            "posição",
            s.status.posx != null
              ? `${Math.round(s.status.posx)}, ${Math.round(s.status.posy ?? 0)}, ${Math.round(s.status.posz ?? 0)}`
              : undefined,
          ],
        ]}
      />
      <SectionCard
        title="Inventário"
        highlighted={changed.has("inventory")}
        onRestore={() => onSectionRestore("inventory")}
        disabled={detail.online}
        rows={[
          ["dinheiro", s.inventory.money],
          ["capacidade", s.inventory.capacity],
          ["itens", s.inventory.itemCount],
        ]}
      />
      <SectionCard
        title="Equipamentos"
        highlighted={changed.has("equipment")}
        onRestore={() => onSectionRestore("equipment")}
        disabled={detail.online}
        rows={[["itens", s.equipment.itemCount]]}
      />
      <SectionCard
        title="Baú"
        highlighted={changed.has("storehouse")}
        onRestore={() => onSectionRestore("storehouse")}
        disabled={detail.online}
        rows={[
          ["dinheiro", s.storehouse.money],
          ["capacidade", s.storehouse.capacity],
          ["itens (todos)", s.storehouse.itemCount],
        ]}
      />
    </div>
  );
};

const SectionCard = ({
  title,
  rows,
  highlighted,
  onRestore,
  disabled,
}: {
  title: string;
  rows: [string, unknown][];
  highlighted: boolean;
  onRestore: () => void;
  disabled?: boolean;
}) => (
  <div
    className={cn(
      "rounded-md border p-3 text-xs",
      highlighted ? "border-primary/40 bg-primary/5" : "border-border bg-card/30",
    )}
  >
    <div className="mb-2 flex items-center justify-between">
      <div className="font-semibold uppercase tracking-wider text-foreground/90">{title}</div>
      <Button size="sm" variant="outline" onClick={onRestore} disabled={disabled}>
        <RotateCcw className="h-3 w-3" />
        Restaurar seção
      </Button>
    </div>
    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-2">
          <dt className="text-muted-foreground">{k}</dt>
          <dd className="text-foreground">{v == null ? "—" : String(v)}</dd>
        </div>
      ))}
    </dl>
  </div>
);
