import { useEffect, useMemo, useState } from "react";
import {
  GitCompareArrows,
  Loader2,
  RotateCcw,
  ShieldAlert,
  AlertCircle,
  CheckCircle2,
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
import {
  pwApi,
  EndpointMissingError,
  type BackupRecord,
  type SaveRoleEditableResponse,
} from "@/lib/pwApiActions";
import { toast } from "sonner";

type SectionKey = "status" | "inventory" | "equipment" | "storehouse" | "task";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  backup: BackupRecord | null;
  /** Disparado após restore parcial bem-sucedido (recarrega listBackups na tela pai). */
  onRestored?: () => void;
}

const basename = (p: string) => {
  const i = Math.max(p.lastIndexOf("/"), p.lastIndexOf("\\"));
  return i >= 0 ? p.slice(i + 1) : p;
};

/** Extrai o template (tolerando wrappers `role`/`template`/raw). */
const extractTemplate = (raw: unknown): Record<string, unknown> | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (r.template && typeof r.template === "object") return r.template as Record<string, unknown>;
  if (r.role && typeof r.role === "object") {
    const role = r.role as Record<string, unknown>;
    if (role.template && typeof role.template === "object") return role.template as Record<string, unknown>;
    return role;
  }
  // Pode já ser o template direto.
  if (r.status || r.inventory || r.equipment || r.storehouse || r.base) return r;
  return null;
};

const fmt = (v: unknown): string => {
  if (v == null) return "—";
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
};

interface DiffRow {
  label: string;
  backup: string;
  current: string;
  diff: boolean;
}

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

const buildStatusRows = (a: Record<string, unknown> | null, b: Record<string, unknown> | null): DiffRow[] => {
  const fields = ["level", "level2", "reputation", "hp", "mp", "exp", "sp", "posx", "posy", "posz", "worldtag"];
  return fields.map((f) => {
    const va = fmt((a as Record<string, unknown> | null)?.[f]);
    const vb = fmt((b as Record<string, unknown> | null)?.[f]);
    return { label: f, backup: va, current: vb, diff: va !== vb };
  });
};

const buildInventoryRows = (a: Record<string, unknown> | null, b: Record<string, unknown> | null): DiffRow[] => {
  const rows: DiffRow[] = [];
  const push = (label: string, va: unknown, vb: unknown) => {
    const sa = fmt(va);
    const sb = fmt(vb);
    rows.push({ label, backup: sa, current: sb, diff: sa !== sb });
  };
  push("money", a?.money, b?.money);
  push("capacity", a?.capacity, b?.capacity);
  push("items (preenchidos)", countItems(a, "items"), countItems(b, "items"));
  return rows;
};

const buildEquipmentRows = (a: Record<string, unknown> | null, b: Record<string, unknown> | null): DiffRow[] => {
  return [
    {
      label: "items (preenchidos)",
      backup: String(countItems(a, "items")),
      current: String(countItems(b, "items")),
      diff: countItems(a, "items") !== countItems(b, "items"),
    },
  ];
};

const buildStorehouseRows = (a: Record<string, unknown> | null, b: Record<string, unknown> | null): DiffRow[] => {
  const rows: DiffRow[] = [];
  const push = (label: string, va: unknown, vb: unknown) => {
    const sa = fmt(va);
    const sb = fmt(vb);
    rows.push({ label, backup: sa, current: sb, diff: sa !== sb });
  };
  push("money", a?.money, b?.money);
  push("capacity", a?.capacity, b?.capacity);
  for (const k of ["items", "dress", "material", "generalcard"]) {
    push(`${k} (preenchidos)`, countItems(a, k), countItems(b, k));
  }
  return rows;
};

const buildTaskRows = (a: Record<string, unknown> | null, b: Record<string, unknown> | null): DiffRow[] => {
  // Algumas APIs guardam task em status, outras como section própria.
  const fields = ["task_data", "task_complete", "task_inventory"];
  return fields.map((f) => {
    const va = fmt(a?.[f]);
    const vb = fmt(b?.[f]);
    return { label: f, backup: va, current: vb, diff: va !== vb };
  });
};

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "status", label: "Status" },
  { key: "inventory", label: "Inventário" },
  { key: "equipment", label: "Equipamento" },
  { key: "storehouse", label: "Storehouse" },
  { key: "task", label: "Tasks" },
];

export const CompareBackupDialog = ({ open, onOpenChange, backup, onRestored }: Props) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [backupTpl, setBackupTpl] = useState<Record<string, unknown> | null>(null);
  const [currentTpl, setCurrentTpl] = useState<Record<string, unknown> | null>(null);
  const [online, setOnline] = useState<boolean>(false);

  const [confirmSection, setConfirmSection] = useState<SectionKey | null>(null);
  const [restoring, setRestoring] = useState<SectionKey | null>(null);
  const [lastResult, setLastResult] = useState<{ section: SectionKey; res: SaveRoleEditableResponse } | null>(null);

  const roleid = backup?.roleid ?? null;
  const name = backup?.name || (backup ? basename(backup.file) : "");

  const loadAll = async () => {
    if (!backup || roleid == null) return;
    setLoading(true);
    setError(null);
    setBackupTpl(null);
    setCurrentTpl(null);
    setLastResult(null);
    try {
      // Backup content: endpoint dedicado (POST JSON). Fallback dry_run só se 404/missing.
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
          // Fallback: usa restoreBackup dry_run que retorna `source`.
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

      // Estado atual do role real.
      const cur = await pwApi.getRoleEditable(roleid);
      if (!cur?.success) throw new Error(cur?.error || "getRoleEditable retornou success:false");
      const cTpl = extractTemplate(cur.template ?? cur.role);

      setBackupTpl(bTpl);
      setCurrentTpl(cTpl);
      setOnline(Boolean(cur.online));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && backup && roleid != null) {
      void loadAll();
    } else if (!open) {
      setBackupTpl(null);
      setCurrentTpl(null);
      setError(null);
      setOnline(false);
      setConfirmSection(null);
      setRestoring(null);
      setLastResult(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, backup?.file]);

  const sectionData = useMemo(() => {
    return SECTIONS.map((s) => {
      const a = (backupTpl?.[s.key] as Record<string, unknown> | undefined) ?? null;
      const b = (currentTpl?.[s.key] as Record<string, unknown> | undefined) ?? null;
      let rows: DiffRow[] = [];
      if (s.key === "status") rows = buildStatusRows(a, b);
      else if (s.key === "inventory") rows = buildInventoryRows(a, b);
      else if (s.key === "equipment") rows = buildEquipmentRows(a, b);
      else if (s.key === "storehouse") rows = buildStorehouseRows(a, b);
      else if (s.key === "task") rows = buildTaskRows(a, b);
      return {
        ...s,
        rows,
        diffCount: rows.filter((r) => r.diff).length,
        hasBackup: a !== null,
      };
    });
  }, [backupTpl, currentTpl]);

  const performRestore = async () => {
    if (!confirmSection || !backup || roleid == null || !backupTpl) return;
    const section = confirmSection;
    const sectionPayload = backupTpl[section];
    if (sectionPayload == null) {
      toast.error(`Backup não contém a seção '${section}'.`);
      setConfirmSection(null);
      return;
    }
    setRestoring(section);
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
      setLastResult({ section, res });
      setConfirmSection(null);
      // Recarrega current state e avisa pai pra recarregar listBackups.
      void loadAll();
      onRestored?.();
    } catch (e) {
      toast.error("Falha na restauração", {
        description: e instanceof Error ? e.message : String(e),
      });
      setConfirmSection(null);
    } finally {
      setRestoring(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompareArrows className="h-4 w-4 text-primary" />
              Comparar & restaurar seção
            </DialogTitle>
            <DialogDescription>
              Backup <code className="font-mono">{name}</code> vs. estado atual do{" "}
              <strong>roleid {roleid ?? "?"}</strong>. Personagem deve estar{" "}
              <strong>offline</strong> para restaurar.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando backup e estado atual…
            </div>
          ) : error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <div className="flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4" /> Erro ao comparar
              </div>
              <p className="mt-1 whitespace-pre-wrap">{error}</p>
            </div>
          ) : !backupTpl || !currentTpl ? (
            <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Sem dados para comparar.
            </p>
          ) : (
            <>
              {online && (
                <div className="rounded-md border border-warning/40 bg-warning/10 p-2 text-xs text-warning">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Personagem ONLINE — restauração será bloqueada pela VPS. Faça kick antes.
                  </span>
                </div>
              )}

              <Tabs defaultValue="status">
                <TabsList className="grid w-full grid-cols-5">
                  {sectionData.map((s) => (
                    <TabsTrigger key={s.key} value={s.key} className="text-xs">
                      {s.label}
                      {s.diffCount > 0 && (
                        <span className="ml-1.5 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] font-mono text-primary">
                          {s.diffCount}
                        </span>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {sectionData.map((s) => (
                  <TabsContent key={s.key} value={s.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        {s.diffCount} diferença(s) detectada(s).
                      </div>
                      <Button
                        size="sm"
                        variant={s.diffCount > 0 ? "destructive" : "outline"}
                        disabled={!s.hasBackup || online || restoring !== null}
                        onClick={() => setConfirmSection(s.key)}
                        title={
                          !s.hasBackup
                            ? "Backup não contém esta seção"
                            : online
                              ? "Personagem online — bloqueado"
                              : `Restaurar somente ${s.label} do backup`
                        }
                      >
                        {restoring === s.key ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                        Restaurar {s.label}
                      </Button>
                    </div>

                    <div className="max-h-[45vh] overflow-y-auto rounded-md border border-border">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-card/95 backdrop-blur">
                          <tr className="border-b border-border">
                            <th className="px-3 py-2 text-left font-semibold">Campo</th>
                            <th className="px-3 py-2 text-left font-semibold">Backup</th>
                            <th className="px-3 py-2 text-left font-semibold">Atual</th>
                          </tr>
                        </thead>
                        <tbody>
                          {s.rows.map((r) => (
                            <tr
                              key={r.label}
                              className={`border-b border-border/40 ${r.diff ? "bg-primary/5" : ""}`}
                            >
                              <td className="px-3 py-1.5 font-mono text-[10px] text-muted-foreground">
                                {r.label}
                              </td>
                              <td
                                className={`px-3 py-1.5 font-mono ${
                                  r.diff ? "font-semibold text-primary" : "text-muted-foreground"
                                }`}
                              >
                                {r.backup}
                              </td>
                              <td
                                className={`px-3 py-1.5 font-mono ${
                                  r.diff ? "font-semibold text-foreground" : "text-muted-foreground"
                                }`}
                              >
                                {r.current}
                              </td>
                            </tr>
                          ))}
                          {s.rows.length === 0 && (
                            <tr>
                              <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">
                                Sem campos para comparar.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </>
          )}

          {lastResult && <RestoreSectionResult section={lastResult.section} res={lastResult.res} />}

          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={confirmSection !== null}
        onOpenChange={(o) => {
          if (!o && restoring === null) setConfirmSection(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlert className="h-5 w-5" />
              Confirmar restauração parcial
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  Restaurar <strong>somente {confirmSection}</strong> do backup{" "}
                  <code className="font-mono text-[11px]">{name}</code> para o{" "}
                  <strong>roleid {roleid}</strong>?
                </p>
                <p className="text-xs text-warning">
                  Outras seções (base, demais sections) NÃO serão tocadas. Um novo backup do estado
                  atual é criado pelo servidor antes do write.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring !== null}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void performRestore();
              }}
              disabled={restoring !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {restoring !== null ? "Aplicando…" : `Sim, restaurar ${confirmSection}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const RestoreSectionResult = ({
  section,
  res,
}: {
  section: SectionKey;
  res: SaveRoleEditableResponse;
}) => {
  const verified = res.saved?.verified ?? res.verified;
  const roleJson = res.saved?.backups?.role_json?.file ?? res.backups?.role_json?.file;
  const clsFile = res.saved?.backups?.clsconfig_file?.file;
  return (
    <div className="rounded-lg border border-success/40 bg-success/10 p-3 text-xs">
      <div className="mb-2 flex items-center gap-2 font-semibold text-success">
        <CheckCircle2 className="h-4 w-4" />
        Seção '{section}' restaurada
        {verified ? " (verificado)" : " (não verificado)"} — roleid {res.roleid}
      </div>
      <div className="space-y-1 font-mono text-[11px] text-muted-foreground">
        {roleJson && <div>role_json: {roleJson}</div>}
        {clsFile && <div>clsconfig_file: {clsFile}</div>}
        {!roleJson && !clsFile && <div>Sem detalhes de backup retornados.</div>}
      </div>
    </div>
  );
};
