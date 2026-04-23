// Mini-modal de inserção de item: escolhe destino, slot/pos, e os campos
// avançados (count/max_count/proctype/expire_date/guid1/guid2/mask/data).
// Após confirmação, devolve um pedido de inserção que o caller resolve
// (atualiza template em memória OU adiciona ao kit em edição).
//
// Não fala com a API/back direto. NUNCA dispara save automático.
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertTriangle, Plus } from "lucide-react";
import type { ClsItem } from "@/types/clsconfig";
import type { CatalogItem } from "@/lib/pwApiActions";
import { normalizeItem } from "@/lib/itemTools";
import { summarizeIssues, validateItems } from "@/lib/validateItem";

export type InsertDestination =
  | "inventory.items"
  | "equipment.items"
  | "storehouse.items"
  | "storehouse.dress"
  | "storehouse.material"
  | "storehouse.generalcard"
  | "task.task_inventory";

export interface InsertContextSlot {
  /** Itens já existentes na seção (para sugerir slot vazio + detectar colisões). */
  items: ClsItem[];
  /** Capacidade declarada da seção (limita pos máximo). Padrão: max(items.pos)+1 ou 64. */
  capacity?: number;
}

/** Mapeamento das seções disponíveis no momento. */
export type InsertContextMap = Partial<Record<InsertDestination, InsertContextSlot>>;

export interface InsertResult {
  destination: InsertDestination;
  item: ClsItem;
  /** True se o destino já tinha item nesse pos — caller decide se confirma. */
  collided: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Item escolhido no catálogo. */
  source: CatalogItem | null;
  /** Seções disponíveis nesta tela. Vazias são desabilitadas no radio. */
  contexts: InsertContextMap;
  /** Destino default (primeira seção habilitada por padrão). */
  defaultDestination?: InsertDestination;
  onInsert: (result: InsertResult) => void;
}

const DESTINATION_LABELS: Record<InsertDestination, string> = {
  "inventory.items": "Inventário",
  "equipment.items": "Equipamento",
  "storehouse.items": "Baú · Itens",
  "storehouse.dress": "Baú · Roupas",
  "storehouse.material": "Baú · Material",
  "storehouse.generalcard": "Baú · Cartas",
  "task.task_inventory": "Task · Inventário",
};

/** Encontra o primeiro pos vazio dentro da capacidade. */
function firstEmptyPos(items: ClsItem[], cap: number): number {
  const used = new Set(items.filter((it) => it.id > 0).map((it) => it.pos));
  for (let i = 0; i < cap; i++) {
    if (!used.has(i)) return i;
  }
  return Math.max(0, cap - 1);
}

function effectiveCapacity(ctx: InsertContextSlot | undefined): number {
  if (!ctx) return 64;
  if (ctx.capacity && Number.isFinite(ctx.capacity)) return Math.max(1, ctx.capacity);
  const maxPos = ctx.items.reduce((m, it) => Math.max(m, it.pos + 1), 0);
  return Math.max(maxPos, 64);
}

export const ItemInsertModal = ({
  open,
  onOpenChange,
  source,
  contexts,
  defaultDestination,
  onInsert,
}: Props) => {
  const enabledDestinations = useMemo(
    () => (Object.keys(contexts) as InsertDestination[]).filter((k) => !!contexts[k]),
    [contexts],
  );

  const [destination, setDestination] = useState<InsertDestination | null>(
    defaultDestination ?? enabledDestinations[0] ?? null,
  );
  const [autoSlot, setAutoSlot] = useState(true);
  const [pos, setPos] = useState<number>(0);
  const [count, setCount] = useState<number>(1);
  const [maxCount, setMaxCount] = useState<number>(1);
  const [proctype, setProctype] = useState<number>(0);
  const [expireDate, setExpireDate] = useState<number>(0);
  const [guid1, setGuid1] = useState<number>(0);
  const [guid2, setGuid2] = useState<number>(0);
  const [mask, setMask] = useState<number>(0);
  const [dataHex, setDataHex] = useState<string>("");

  // Reset ao abrir / mudar item
  useEffect(() => {
    if (!open || !source) return;
    const dest = defaultDestination ?? enabledDestinations[0] ?? null;
    setDestination(dest);
    setAutoSlot(true);
    setCount(1);
    setMaxCount(Math.max(1, source.max_count ?? source.stack_max ?? 1));
    setProctype(Number(source.defaults?.proctype ?? 0) || 0);
    setExpireDate(Number(source.defaults?.expire_date ?? 0) || 0);
    setGuid1(Number(source.defaults?.guid1 ?? 0) || 0);
    setGuid2(Number(source.defaults?.guid2 ?? 0) || 0);
    setMask(Number(source.defaults?.mask ?? 0) || 0);
    setDataHex(typeof source.defaults?.data === "string" ? source.defaults.data : "");
  }, [open, source, defaultDestination, enabledDestinations]);

  // Recalcula auto pos quando autoSlot, destino ou contextos mudam
  useEffect(() => {
    if (!destination) return;
    if (!autoSlot) return;
    const ctx = contexts[destination];
    if (!ctx) return;
    setPos(firstEmptyPos(ctx.items, effectiveCapacity(ctx)));
  }, [autoSlot, destination, contexts]);

  if (!source) return null;

  const ctx = destination ? contexts[destination] : undefined;
  const cap = effectiveCapacity(ctx);
  const collided = !!ctx?.items.some((it) => it.pos === pos && it.id > 0);

  const candidate: ClsItem = normalizeItem({
    id: source.id,
    pos,
    count,
    max_count: maxCount,
    data: dataHex,
    proctype,
    expire_date: expireDate,
    guid1,
    guid2,
    mask,
  });

  // Validação: bloqueia critical/error.
  const validation = summarizeIssues(
    validateItems([candidate], {
      section: destination ?? "inventory.items",
      tab: "inventory",
      label: DESTINATION_LABELS[destination ?? "inventory.items"],
      capacity: cap,
    }),
  );

  const blocking = validation.errors.length + validation.criticals.length > 0;
  const canInsert = !!destination && !blocking;

  const confirm = () => {
    if (!destination) return;
    onInsert({ destination, item: candidate, collided });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-primary" />
            Adicionar item
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            #{source.id} · {source.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-1.5 block text-xs uppercase tracking-wider text-muted-foreground">
              Destino
            </Label>
            <RadioGroup
              value={destination ?? ""}
              onValueChange={(v) => setDestination(v as InsertDestination)}
              className="grid grid-cols-2 gap-1.5"
            >
              {(Object.keys(DESTINATION_LABELS) as InsertDestination[]).map((key) => {
                const enabled = enabledDestinations.includes(key);
                return (
                  <label
                    key={key}
                    className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${
                      enabled
                        ? "border-border bg-background/40 hover:border-primary/50 cursor-pointer"
                        : "border-border/40 bg-muted/20 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <RadioGroupItem value={key} disabled={!enabled} />
                    {DESTINATION_LABELS[key]}
                  </label>
                );
              })}
            </RadioGroup>
            {enabledDestinations.length === 0 && (
              <p className="mt-2 text-[11px] text-warning">
                Nenhum destino disponível neste contexto.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Pos {ctx ? `(0..${cap - 1})` : ""}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={Math.max(0, cap - 1)}
                  value={pos}
                  onChange={(e) => {
                    setAutoSlot(false);
                    setPos(parseInt(e.target.value, 10) || 0);
                  }}
                  disabled={!destination}
                />
                <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={autoSlot}
                    onChange={(e) => setAutoSlot(e.target.checked)}
                  />
                  auto
                </label>
              </div>
              {collided && (
                <p className="mt-1 flex items-center gap-1 text-[10px] text-warning">
                  <AlertTriangle className="h-3 w-3" />
                  Slot já ocupado — será substituído.
                </p>
              )}
            </div>
            <NumField label="Count" value={count} onChange={setCount} min={1} />
            <NumField label="Max count" value={maxCount} onChange={setMaxCount} min={0} />
            <NumField label="Proctype" value={proctype} onChange={setProctype} min={0} />
            <NumField label="Expire date" value={expireDate} onChange={setExpireDate} min={0} />
            <NumField label="Mask" value={mask} onChange={setMask} min={0} />
            <NumField label="Guid1" value={guid1} onChange={setGuid1} min={0} />
            <NumField label="Guid2" value={guid2} onChange={setGuid2} min={0} />
          </div>

          <div>
            <Label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
              Data (hex, opcional)
            </Label>
            <Input
              value={dataHex}
              onChange={(e) => setDataHex(e.target.value)}
              placeholder="ex: ff00ab12"
              className="font-mono text-xs"
            />
          </div>

          {blocking && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-[11px] text-destructive">
              <div className="font-semibold">Não é possível adicionar:</div>
              <ul className="mt-1 list-disc pl-4">
                {[...validation.criticals, ...validation.errors].slice(0, 3).map((i, idx) => (
                  <li key={idx}>{i.message}</li>
                ))}
              </ul>
            </div>
          )}
          {!blocking && validation.warnings.length > 0 && (
            <div className="rounded-md border border-warning/40 bg-warning/10 p-2 text-[11px] text-warning-foreground">
              <div className="flex items-center gap-1 font-semibold text-warning">
                <AlertTriangle className="h-3 w-3" /> Aviso
              </div>
              <ul className="mt-1 list-disc pl-4">
                {validation.warnings.slice(0, 3).map((i, idx) => (
                  <li key={idx}>{i.message}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={confirm} disabled={!canInsert}>
            <Plus className="h-4 w-4" />
            Adicionar em {destination ? DESTINATION_LABELS[destination] : "..."}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const NumField = ({
  label,
  value,
  onChange,
  min,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) => (
  <div>
    <Label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
      {label}
    </Label>
    <Input
      type="number"
      min={min}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className="font-mono text-xs"
    />
  </div>
);
