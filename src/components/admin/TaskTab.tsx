// Aba "Tarefas" — edita o bloco `task` do template.
//
// Campos suportados:
//   - task_data, task_complete, task_finishtime → blobs hex opacos.
//     Editor textual simples + contador de bytes + validação hex par.
//     NÃO interpretamos o conteúdo (formato binário do gamedbd).
//   - task_inventory → lista de slots reaproveitando ItemList/ItemEditor.
//
// O salvamento real continua no fluxo padrão (botão Salvar do editor).
// Aqui só alteramos estado local.
import { useMemo, useState } from "react";
import { AlertTriangle, Eraser, Info } from "lucide-react";
import { toast } from "sonner";
import type { ClsItem, ClsTask, ClsTemplate } from "@/types/clsconfig";
import { Textarea } from "@/components/ui/textarea";
import { ItemList } from "./ItemList";
import { ClearSectionDialog } from "./ClearSectionDialog";
import { clearItems, summarizeSection } from "@/lib/clearSection";
import { cn } from "@/lib/utils";

interface Props {
  template: ClsTemplate;
  onChange: (next: ClsTemplate) => void;
}

const EMPTY_TASK: ClsTask = {
  task_data: "",
  task_complete: "",
  task_finishtime: "",
  task_inventory: [],
};

const HEX_RE = /^[0-9a-fA-F]*$/;

interface HexStatus {
  bytes: number;
  evenLength: boolean;
  validChars: boolean;
}

const inspectHex = (s: string): HexStatus => {
  const trimmed = s.replace(/\s+/g, "");
  return {
    bytes: Math.floor(trimmed.length / 2),
    evenLength: trimmed.length % 2 === 0,
    validChars: HEX_RE.test(trimmed),
  };
};

export const TaskTab = ({ template, onChange }: Props) => {
  const task: ClsTask = template.task ?? EMPTY_TASK;
  const [clearOpen, setClearOpen] = useState(false);

  const setTask = (patch: Partial<ClsTask>) => {
    onChange({ ...template, task: { ...task, ...patch } });
  };

  const setInventory = (items: ClsItem[]) => setTask({ task_inventory: items });

  const dataStatus = useMemo(() => inspectHex(task.task_data), [task.task_data]);
  const completeStatus = useMemo(
    () => inspectHex(task.task_complete),
    [task.task_complete],
  );
  const finishStatus = useMemo(
    () => inspectHex(task.task_finishtime),
    [task.task_finishtime],
  );

  const filledInv = task.task_inventory.filter((i) => i.id > 0).length;

  return (
    <div className="space-y-6">
      {/* Aviso de risco */}
      <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div className="space-y-1.5 text-sm">
          <p className="font-semibold text-destructive">
            Editar <code className="font-mono">task_data</code> pode afetar quests
            do personagem/template.
          </p>
          <p className="text-xs text-muted-foreground">
            Use preferencialmente <strong>backup antes de alterar</strong>. As
            mudanças só vão para a VPS quando você clicar em Salvar — o backup
            automático acontece nesse momento.
          </p>
        </div>
      </div>

      {/* Hex editors */}
      <section className="grid grid-cols-1 gap-4">
        <HexField
          label="task_data"
          description="Estado bruto das quests ativas (formato binário do gamedbd)."
          value={task.task_data}
          status={dataStatus}
          onChange={(v) => setTask({ task_data: v })}
        />
        <HexField
          label="task_complete"
          description="Bitmap das quests já concluídas."
          value={task.task_complete}
          status={completeStatus}
          onChange={(v) => setTask({ task_complete: v })}
        />
        <HexField
          label="task_finishtime"
          description="Timestamps de conclusão de quests diárias/semanais."
          value={task.task_finishtime}
          status={finishStatus}
          onChange={(v) => setTask({ task_finishtime: v })}
        />
      </section>

      {/* task_inventory */}
      <section className="space-y-3 rounded-lg border border-border bg-card/40 p-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              task_inventory
            </h3>
            <span className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {filledInv}/{task.task_inventory.length}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            disabled={filledInv === 0}
            className="inline-flex items-center gap-1.5 rounded-md border border-destructive/40 bg-card/60 px-2.5 py-1.5 text-xs font-semibold text-destructive transition-smooth hover:border-destructive disabled:opacity-40"
          >
            <Eraser className="h-3.5 w-3.5" />
            Limpar seção
          </button>
        </header>

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Itens carregados/recompensa associados às quests. Mesma validação dos
          outros inventários.
        </p>

        <ItemList
          title="Slots de quest"
          items={task.task_inventory}
          onChange={setInventory}
        />
      </section>

      <ClearSectionDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        section="task.task_inventory"
        preview={summarizeSection(task.task_inventory, {
          capacity: 0,
          money: 0,
          hasMoney: false,
        })}
        onConfirm={() => {
          setInventory(clearItems(task.task_inventory));
          toast.success("task_inventory limpo");
        }}
      />
    </div>
  );
};

interface HexFieldProps {
  label: string;
  description: string;
  value: string;
  status: HexStatus;
  onChange: (next: string) => void;
}

const HexField = ({ label, description, value, status, onChange }: HexFieldProps) => {
  const hasError = value.length > 0 && (!status.validChars || !status.evenLength);
  return (
    <div className="space-y-1.5 rounded-lg border border-border bg-card/40 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <label className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
            {label}
          </label>
          <p className="text-[11px] text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-muted-foreground">
            {status.bytes} bytes ({value.replace(/\s+/g, "").length} hex chars)
          </span>
          {value.length > 0 && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 font-bold uppercase",
                hasError
                  ? "bg-destructive/20 text-destructive"
                  : "bg-emerald-500/15 text-emerald-500",
              )}
            >
              {hasError ? "hex inválido" : "hex ok"}
            </span>
          )}
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="(vazio)"
        spellCheck={false}
        className={cn(
          "min-h-[100px] font-mono text-xs leading-relaxed",
          hasError && "border-destructive focus-visible:ring-destructive",
        )}
      />
      {value.length > 0 && !status.validChars && (
        <p className="text-[11px] text-destructive">
          Apenas caracteres 0-9 / a-f são permitidos.
        </p>
      )}
      {value.length > 0 && status.validChars && !status.evenLength && (
        <p className="text-[11px] text-destructive">
          Tamanho hex deve ser par (cada byte = 2 caracteres).
        </p>
      )}
    </div>
  );
};
