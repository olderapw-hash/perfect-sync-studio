import { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Send, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  buildPositionPayload,
  buildStatusPayload,
  diffSimpleStatus,
  SIMPLE_STATUS_FIELDS,
  type SimpleStatusField,
} from "@/lib/clsconfig";
import { saveHistory } from "@/lib/saveHistory";
import { supabase } from "@/integrations/supabase/client";
import type { ClsEntry, ClsTemplate } from "@/types/clsconfig";
import { toast } from "sonner";

type SectionKey = "status" | "position";

interface RowResult {
  roleid: number;
  className: string;
  status: "pending" | "running" | "ok" | "error";
  message?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Entry de origem — fonte dos novos valores. */
  sourceEntry: ClsEntry;
  /** Template atual sendo editado (com possíveis alterações não salvas). */
  currentTemplate: ClsTemplate;
  /** Lista de todas as entries carregadas (alvos potenciais). */
  allEntries: ClsEntry[];
}

export const BulkApplyDialog = ({
  open,
  onOpenChange,
  sourceEntry,
  currentTemplate,
  allEntries,
}: Props) => {
  // Alvos = todos os outros roleids (não o atual).
  const targets = useMemo(
    () => allEntries.filter((e) => e.template.roleid !== sourceEntry.template.roleid),
    [allEntries, sourceEntry],
  );

  const [section, setSection] = useState<SectionKey>("status");
  const [selectedRoleids, setSelectedRoleids] = useState<Set<number>>(
    () => new Set(targets.map((t) => t.template.roleid)),
  );
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<Record<number, RowResult>>({});

  const statusDiff = useMemo(
    () => diffSimpleStatus(sourceEntry.template, currentTemplate),
    [sourceEntry, currentTemplate],
  );

  const positionFields = {
    worldtag: currentTemplate.status.worldtag,
    posx: currentTemplate.status.posx,
    posy: currentTemplate.status.posy,
    posz: currentTemplate.status.posz,
  };

  const positionChanged =
    sourceEntry.template.status.worldtag !== positionFields.worldtag ||
    sourceEntry.template.status.posx !== positionFields.posx ||
    sourceEntry.template.status.posy !== positionFields.posy ||
    sourceEntry.template.status.posz !== positionFields.posz;

  const toggle = (roleid: number) => {
    setSelectedRoleids((prev) => {
      const next = new Set(prev);
      if (next.has(roleid)) next.delete(roleid);
      else next.add(roleid);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRoleids.size === targets.length) setSelectedRoleids(new Set());
    else setSelectedRoleids(new Set(targets.map((t) => t.template.roleid)));
  };

  const previewLabel = useMemo(() => {
    if (section === "status") {
      const parts = (Object.keys(statusDiff) as SimpleStatusField[]).map(
        (k) => `${k}=${statusDiff[k]}`,
      );
      return parts.length ? parts.join(", ") : "(nenhuma mudança em status)";
    }
    return `worldtag=${positionFields.worldtag}, posx=${positionFields.posx}, posy=${positionFields.posy}, posz=${positionFields.posz}`;
  }, [section, statusDiff, positionFields]);

  const canRun =
    selectedRoleids.size > 0 &&
    !running &&
    (section === "status" ? Object.keys(statusDiff).length > 0 : positionChanged);

  const run = async () => {
    setRunning(true);
    const init: Record<number, RowResult> = {};
    for (const t of targets) {
      if (selectedRoleids.has(t.template.roleid)) {
        init[t.template.roleid] = {
          roleid: t.template.roleid,
          className: t.template.summary.class_name ?? `cls ${t.template.summary.cls}`,
          status: "pending",
        };
      }
    }
    setResults(init);

    let okCount = 0;
    let errCount = 0;

    for (const target of targets) {
      const rid = target.template.roleid;
      if (!selectedRoleids.has(rid)) continue;

      setResults((prev) => ({ ...prev, [rid]: { ...prev[rid], status: "running" } }));

      try {
        let payload: unknown;
        if (section === "status") {
          payload = buildStatusPayload(target, statusDiff);
        } else {
          payload = buildPositionPayload(target, {
            status: positionFields,
          });
        }

        const { data, error } = await supabase.functions.invoke("clsconfig-proxy/clsconfig", {
          method: "POST",
          body: payload,
        });
        if (error) {
          const ctx = (error as unknown as { context?: Response }).context;
          let extra = "";
          if (ctx && typeof ctx.text === "function") {
            try { extra = await ctx.text(); } catch { /* ignore */ }
          }
          throw new Error(extra ? `${error.message}: ${extra}` : error.message);
        }
        if (data && typeof data === "object" && (data as { success?: boolean }).success === false) {
          throw new Error((data as { error?: string }).error || "save falhou");
        }

        okCount++;
        setResults((prev) => ({
          ...prev,
          [rid]: { ...prev[rid], status: "ok", message: "salvo" },
        }));
        saveHistory.pushDiff({
          roleid: rid,
          className: target.template.summary.class_name ?? `cls ${target.template.summary.cls}`,
          field: `bulk:${section}`,
          oldValue: "(em massa)",
          newValue: previewLabel,
          status: "ok",
        });
      } catch (e) {
        errCount++;
        const msg = e instanceof Error ? e.message : "erro";
        setResults((prev) => ({
          ...prev,
          [rid]: { ...prev[rid], status: "error", message: msg },
        }));
        saveHistory.pushDiff({
          roleid: rid,
          className: target.template.summary.class_name ?? `cls ${target.template.summary.cls}`,
          field: `bulk:${section}`,
          oldValue: "(em massa)",
          newValue: previewLabel,
          status: "error",
          error: msg,
        });
        // CONTINUA — não para no primeiro erro (decisão do usuário).
      }
    }

    setRunning(false);
    if (errCount === 0) toast.success(`Aplicado em ${okCount} roleid(s)`);
    else toast.warning(`Concluído: ${okCount} ok, ${errCount} erro(s)`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            Aplicar em massa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border bg-card/40 p-3 text-xs">
            <div className="mb-2 font-semibold text-foreground">Seção a replicar</div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={section === "status" ? "default" : "outline"}
                onClick={() => setSection("status")}
              >
                Status simples ({SIMPLE_STATUS_FIELDS.length} campos)
              </Button>
              <Button
                size="sm"
                variant={section === "position" ? "default" : "outline"}
                onClick={() => setSection("position")}
              >
                Posição + worldtag
              </Button>
            </div>
            <div className="mt-3 rounded bg-background/40 p-2 font-mono text-[11px] text-muted-foreground">
              {previewLabel}
            </div>
            {section === "status" && Object.keys(statusDiff).length === 0 && (
              <p className="mt-2 text-[11px] text-warning">
                Nenhum campo simples de status mudou em relação ao original. Edite algo primeiro.
              </p>
            )}
            {section === "position" && !positionChanged && (
              <p className="mt-2 text-[11px] text-warning">
                Posição/worldtag iguais ao original. Edite ou teleporte primeiro.
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Alvos ({selectedRoleids.size}/{targets.length})
              </span>
              <button
                onClick={toggleAll}
                className="text-[11px] text-primary hover:underline"
                disabled={running}
              >
                {selectedRoleids.size === targets.length ? "Desmarcar todos" : "Marcar todos"}
              </button>
            </div>
            <ul className="max-h-[40vh] space-y-1 overflow-y-auto rounded-md border border-border bg-background/30 p-2">
              {targets.map((t) => {
                const rid = t.template.roleid;
                const r = results[rid];
                const className = t.template.summary.class_name ?? `cls ${t.template.summary.cls}`;
                return (
                  <li
                    key={rid}
                    className="flex items-center gap-2 rounded px-2 py-1.5 hover:bg-card/40"
                  >
                    <Checkbox
                      checked={selectedRoleids.has(rid)}
                      onCheckedChange={() => toggle(rid)}
                      disabled={running}
                    />
                    <span className="flex-1 truncate text-xs">
                      <span className="font-semibold text-foreground">{className}</span>{" "}
                      <span className="font-mono text-muted-foreground">(roleid {rid})</span>
                    </span>
                    {r?.status === "running" && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                    {r?.status === "ok" && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                    {r?.status === "error" && (
                      <span title={r.message} className="flex items-center gap-1 text-destructive">
                        <XCircle className="h-3.5 w-3.5" />
                        <span className="max-w-[200px] truncate text-[10px]">{r.message}</span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={running}>
              Fechar
            </Button>
            <Button onClick={run} disabled={!canRun}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {running ? "Aplicando..." : `Aplicar em ${selectedRoleids.size}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
