import { useState } from "react";
import {
  Trash2,
  MoreHorizontal,
  Copy,
  ClipboardPaste,
  Eraser,
  Sparkles,
  Files,
  Move,
  Search,
} from "lucide-react";
import type { ClsItem } from "@/types/clsconfig";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  applyToList,
  clearSlot,
  copyToClipboard,
  duplicateToPos,
  isEmptySlot,
  moveToPos,
  normalizeItem,
  parseItemJson,
  readFromClipboard,
  stringifyItem,
} from "@/lib/itemTools";
import { summarizeIssues, validateItems } from "@/lib/validateItem";
import { ItemCatalogAdvancedDialog } from "./ItemCatalogAdvancedDialog";
import type { InsertResult } from "./ItemInsertModal";
import { getEquipmentSlotDef, getEquipmentSlotLabel } from "@/lib/equipmentSlots";

interface Props {
  item: ClsItem;
  onChange: (next: ClsItem) => void;
  onRemove: () => void;
  /**
   * Opcional — toda a lista de slots irmãos (mesma seção) e callback pra
   * substituí-la. Quando fornecido, o ItemEditor habilita as Ferramentas
   * Rápidas: Duplicar / Mover / Colar JSON (com swap/replace).
   */
  peerItems?: ClsItem[];
  onSlotsChange?: (next: ClsItem[]) => void;
  /** Capacidade da seção (limita destinos válidos). Default: max(peer pos)+1 ou 64. */
  capacity?: number;
  /**
   * Seção em que o item vive — habilita label real do slot quando for
   * `equipment.items` (ex: "Slot: Arma (pos 0)") em vez de só "pos 0".
   */
  section?:
    | "inventory.items"
    | "equipment.items"
    | "storehouse.items"
    | "storehouse.dress"
    | "storehouse.material"
    | "storehouse.generalcard"
    | "task.task_inventory";
}

type SlotPickerMode = "duplicate" | "move" | null;

export const ItemEditor = ({
  item,
  onChange,
  onRemove,
  peerItems,
  onSlotsChange,
  capacity,
  section,
}: Props) => {
  const [pickerMode, setPickerMode] = useState<SlotPickerMode>(null);
  const [pickerDest, setPickerDest] = useState<string>("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [collisionConfirm, setCollisionConfirm] = useState<{
    mode: "duplicate" | "move" | "paste";
    incoming: ClsItem;
    destPos: number;
  } | null>(null);

  const hasPeerOps = !!peerItems && !!onSlotsChange;
  const totalSlots =
    capacity ??
    (peerItems
      ? Math.max(peerItems.reduce((m, it) => Math.max(m, it.pos + 1), 0), 64)
      : 64);

  // Validação ao vivo deste único slot — feedback rápido inline.
  const liveSummary = summarizeIssues(
    validateItems([item], {
      section: "inventory.items",
      tab: "inventory",
      label: "Slot",
      capacity: Math.max(totalSlots, 1),
    }),
  );
  const liveBlocking = liveSummary.errors.length + liveSummary.criticals.length;
  const liveWarnings = liveSummary.warnings.length;

  // ───────────────── Ações de quick-tools ─────────────────

  const handleClear = () => {
    onChange(clearSlot(item));
    toast.success(`Slot ${item.pos} esvaziado`);
  };

  const handleNormalize = () => {
    const next = normalizeItem(item);
    onChange(next);
    toast.success("Item normalizado");
  };

  const handleCopyJson = async () => {
    const ok = await copyToClipboard(stringifyItem(item));
    if (ok) toast.success("JSON do item copiado");
    else toast.error("Não foi possível copiar — copie manualmente");
  };

  const openPaste = async () => {
    setPasteText("");
    const fromClip = await readFromClipboard();
    if (fromClip) setPasteText(fromClip);
    setPasteOpen(true);
  };

  const applyPaste = () => {
    let parsed: ClsItem;
    try {
      parsed = parseItemJson(pasteText, item.pos);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao colar JSON");
      return;
    }
    // Roda validação antes de aplicar — só bloqueia em erro.
    const summary = summarizeIssues(
      validateItems([parsed], {
        section: "inventory.items",
        tab: "inventory",
        label: "JSON colado",
        capacity: Math.max(totalSlots, 1),
      }),
    );
    if (summary.hasBlocking) {
      const first = [...summary.criticals, ...summary.errors][0];
      toast.error(`JSON inválido: ${first?.message ?? "ver console"}`);
      console.warn("[itemTools] paste validation →", summary.issues);
      return;
    }
    onChange(parsed);
    setPasteOpen(false);
    toast.success(`Item colado no slot ${item.pos}`);
  };

  // ─── Duplicar / Mover via picker ───
  const openPicker = (mode: "duplicate" | "move") => {
    setPickerMode(mode);
    // Sugere o próximo slot livre
    if (peerItems) {
      const used = new Set(peerItems.filter((p) => !isEmptySlot(p)).map((p) => p.pos));
      let suggest = item.pos + 1;
      while (used.has(suggest) && suggest < totalSlots) suggest += 1;
      setPickerDest(String(suggest));
    } else {
      setPickerDest("");
    }
  };

  const confirmPicker = () => {
    if (!hasPeerOps || !pickerMode) return;
    const destPos = Math.max(0, Math.trunc(Number(pickerDest)));
    if (!Number.isFinite(destPos) || destPos < 0) {
      toast.error("Slot destino inválido");
      return;
    }
    if (destPos === item.pos) {
      toast.info("Slot destino é o mesmo — nada a fazer");
      setPickerMode(null);
      return;
    }
    const incoming =
      pickerMode === "duplicate"
        ? duplicateToPos(item, destPos)
        : moveToPos(item, destPos);

    const occupied = peerItems!.find((it) => it.pos === destPos);
    if (occupied && !isEmptySlot(occupied)) {
      // pede confirmação antes de sobrescrever / trocar
      setCollisionConfirm({ mode: pickerMode, incoming, destPos });
      return;
    }
    applyPickerResult(pickerMode, incoming, destPos);
  };

  const applyPickerResult = (
    mode: "duplicate" | "move" | "paste",
    incoming: ClsItem,
    destPos: number,
  ) => {
    if (!hasPeerOps) return;
    let next = peerItems!;
    if (mode === "move") {
      // Remove o original (seu slot atual fica vazio) antes de aplicar destino
      next = next.filter((it) => it.pos !== item.pos);
      const result = applyToList(next, incoming, { mode: "upsert" });
      onSlotsChange!(result.next);
    } else {
      // duplicate / paste — só upsert no destino
      const result = applyToList(next, incoming, { mode: "upsert" });
      onSlotsChange!(result.next);
    }
    setPickerMode(null);
    setCollisionConfirm(null);
    toast.success(
      mode === "duplicate"
        ? `Duplicado para slot ${destPos}`
        : mode === "move"
          ? `Movido para slot ${destPos}`
          : `Colado no slot ${destPos}`,
    );
  };

  // ───────────────── Render ─────────────────

  const isEquipmentSection = section === "equipment.items";
  const slotDef = isEquipmentSection ? getEquipmentSlotDef(item.pos) : undefined;
  const slotLabel = isEquipmentSection ? getEquipmentSlotLabel(item.pos) : null;

  return (
    <div className="rounded-xl border border-border bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
            {isEquipmentSection ? (
              <>
                <span className={slotDef ? "text-foreground" : "text-warning"}>
                  {slotLabel}
                </span>
                <span className="ml-1 opacity-60">(pos {item.pos})</span>
              </>
            ) : (
              <>pos {item.pos}</>
            )}
          </span>
          {liveBlocking > 0 && (
            <span className="rounded-md bg-destructive/15 px-1.5 py-0.5 text-[10px] font-semibold text-destructive">
              {liveBlocking} erro{liveBlocking > 1 ? "s" : ""}
            </span>
          )}
          {liveBlocking === 0 && liveWarnings > 0 && (
            <span className="rounded-md bg-yellow-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-500">
              {liveWarnings} aviso{liveWarnings > 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-border bg-card/60 p-1.5 text-muted-foreground transition-smooth hover:border-primary/50 hover:text-primary"
                aria-label="Ferramentas rápidas"
              >
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() => openPicker("duplicate")}
                disabled={!hasPeerOps || isEmptySlot(item)}
              >
                <Files className="mr-2 h-3.5 w-3.5" />
                Duplicar para outro slot
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => openPicker("move")}
                disabled={!hasPeerOps || isEmptySlot(item)}
              >
                <Move className="mr-2 h-3.5 w-3.5" />
                Mover para outro slot
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleClear}
                disabled={isEmptySlot(item)}
              >
                <Eraser className="mr-2 h-3.5 w-3.5" />
                Limpar slot
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyJson}>
                <Copy className="mr-2 h-3.5 w-3.5" />
                Copiar JSON do item
              </DropdownMenuItem>
              <DropdownMenuItem onClick={openPaste}>
                <ClipboardPaste className="mr-2 h-3.5 w-3.5" />
                Colar JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setCatalogOpen(true)}>
                <Search className="mr-2 h-3.5 w-3.5" />
                Buscar no catálogo
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleNormalize}>
                <Sparkles className="mr-2 h-3.5 w-3.5" />
                Normalizar item
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1 text-[11px] text-destructive transition-smooth hover:border-destructive/50"
          >
            <Trash2 className="h-3 w-3" />
            Remover
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Num label="ID" value={item.id} onChange={(v) => onChange({ ...item, id: v })} />
        <Num label="Pos" value={item.pos} onChange={(v) => onChange({ ...item, pos: v })} />
        <Num label="Count" value={item.count} onChange={(v) => onChange({ ...item, count: v })} />
        <Num label="Max count" value={item.max_count} onChange={(v) => onChange({ ...item, max_count: v })} />
        <Num label="Proctype" value={item.proctype} onChange={(v) => onChange({ ...item, proctype: v })} />
        <Num label="Expire date" value={item.expire_date} onChange={(v) => onChange({ ...item, expire_date: v })} />
        <Num label="Guid1" value={item.guid1} onChange={(v) => onChange({ ...item, guid1: v })} />
        <Num label="Guid2" value={item.guid2} onChange={(v) => onChange({ ...item, guid2: v })} />
        <Num label="Mask" value={item.mask} onChange={(v) => onChange({ ...item, mask: v })} />
      </div>

      <label className="mt-2 block">
        <span className="uppercase-label mb-1 block">Data (hex)</span>
        <input
          value={item.data}
          onChange={(e) => onChange({ ...item, data: e.target.value })}
          className="w-full rounded-md border border-border bg-background/60 px-2 py-1.5 font-mono text-[11px] outline-none transition-smooth focus:border-primary"
        />
      </label>

      {/* ─── Picker de slot destino (Duplicar / Mover) ─── */}
      <Dialog
        open={pickerMode != null}
        onOpenChange={(o) => !o && setPickerMode(null)}
      >
        <DialogContent className="max-w-sm border-border bg-card">
          <DialogHeader>
            <DialogTitle>
              {pickerMode === "duplicate" ? "Duplicar item" : "Mover item"} — slot destino
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              Slot atual: <span className="font-mono">{item.pos}</span>
              {hasPeerOps && (
                <>
                  {" · "}faixa válida: <span className="font-mono">0..{totalSlots - 1}</span>
                </>
              )}
            </p>
            <label className="block">
              <span className="uppercase-label mb-1 block">Pos destino</span>
              <input
                type="number"
                min={0}
                max={Math.max(totalSlots - 1, 0)}
                value={pickerDest}
                onChange={(e) => setPickerDest(e.target.value)}
                autoFocus
                className="w-full rounded-md border border-border bg-background/60 px-3 py-2 font-mono text-sm outline-none transition-smooth focus:border-primary"
              />
            </label>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setPickerMode(null)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs transition-smooth hover:border-primary/50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={confirmPicker}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
            >
              {pickerMode === "duplicate" ? "Duplicar" : "Mover"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Paste JSON dialog ─── */}
      <Dialog open={pasteOpen} onOpenChange={(o) => !o && setPasteOpen(false)}>
        <DialogContent className="max-w-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle>Colar JSON do item — slot {item.pos}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p className="text-xs text-muted-foreground">
              Cole o JSON de um item. O campo <span className="font-mono">pos</span> será
              ajustado para <span className="font-mono">{item.pos}</span> automaticamente.
            </p>
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              rows={10}
              spellCheck={false}
              placeholder='{ "id": 12345, "count": 1, "max_count": 1, "data": "" }'
              className="w-full resize-none rounded-md border border-border bg-background/60 px-2 py-1.5 font-mono text-[11px] outline-none transition-smooth focus:border-primary"
            />
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setPasteOpen(false)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-1.5 text-xs transition-smooth hover:border-primary/50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={applyPaste}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
            >
              Aplicar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Confirmação de colisão (destino ocupado) ─── */}
      <AlertDialog
        open={collisionConfirm != null}
        onOpenChange={(o) => !o && setCollisionConfirm(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Slot destino ocupado</AlertDialogTitle>
            <AlertDialogDescription>
              {collisionConfirm && (
                <>
                  O slot <span className="font-mono">{collisionConfirm.destPos}</span> já tem
                  um item. {collisionConfirm.mode === "move" ? "Mover" : collisionConfirm.mode === "duplicate" ? "Duplicar" : "Colar"} aqui vai
                  <strong> substituir o conteúdo atual</strong>. Deseja continuar?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCollisionConfirm(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!collisionConfirm) return;
                applyPickerResult(
                  collisionConfirm.mode,
                  collisionConfirm.incoming,
                  collisionConfirm.destPos,
                );
              }}
            >
              Substituir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Catálogo avançado: preenche o slot atual ─── */}
      <ItemCatalogAdvancedDialog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        contexts={{
          "inventory.items": {
            // Apenas o slot atual — força a inserção a manter o pos.
            items: peerItems ?? [item],
            capacity: totalSlots,
          },
        }}
        defaultDestination="inventory.items"
        onInsert={(res: InsertResult) => {
          // Sempre força para o pos do slot que disparou o catálogo.
          const next: ClsItem = { ...res.item, pos: item.pos };
          onChange(next);
          toast.success(`Item ${next.id} aplicado no slot ${item.pos}`);
        }}
      />
    </div>
  );
};

const Num = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <label className="block">
    <span className="uppercase-label mb-1 block">{label}</span>
    <input
      type="number"
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className="w-full rounded-md border border-border bg-background/60 px-2 py-1.5 font-mono text-xs outline-none transition-smooth focus:border-primary"
    />
  </label>
);
