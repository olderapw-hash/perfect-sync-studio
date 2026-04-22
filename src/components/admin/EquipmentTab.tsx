import type { ClsItem, ClsTemplate } from "@/types/clsconfig";
import { newEmptyItem } from "@/lib/clsconfig";
import { ItemSlot } from "./ItemSlot";
import { ItemEditor } from "./ItemEditor";
import { WarAvatarPicker } from "./WarAvatarPicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { X } from "lucide-react";

interface Props {
  template: ClsTemplate;
  onChange: (next: ClsTemplate) => void;
}

/**
 * Layout paper-doll do PW BR — duas colunas laterais com silhueta no meio.
 *
 * Aba "Normal"  → equipamento real (pos 0..15) — armadura/arma/anéis/etc.
 * Aba "Roupas"  → fashion/cosmético (pos 16..31) — visual sobreposto.
 *
 * As pos do fashion seguem a mesma ordem do equipamento equivalente
 * (cliente PW armazena roupa em pos = equipPos + 16).
 */
const NORMAL_LEFT: { pos: number; label: string }[] = [
  { pos: 0, label: "Capacete" },
  { pos: 1, label: "Colar" },
  { pos: 2, label: "Armadura" },
  { pos: 3, label: "Cinto" },
];
const NORMAL_RIGHT: { pos: number; label: string }[] = [
  { pos: 12, label: "Voadora" },
  { pos: 10, label: "Capa" },
  { pos: 13, label: "Talismã" },
  { pos: 4,  label: "Calça" },
];
const NORMAL_BOTTOM: { pos: number; label: string }[] = [
  { pos: 8,  label: "Arma" },
  { pos: 5,  label: "Botas" },
  { pos: 9,  label: "Sub-arma" },
  { pos: 6,  label: "Anel E" },
  { pos: 11, label: "Pet" },
  { pos: 7,  label: "Anel D" },
];

// Roupas (fashion) — vêm de template.storehouse.dress.
// O cliente PW BR mostra um grid 4×3 de cada lado da silhueta (24 slots).
// Aqui só definimos QUANTOS slots renderizar de cada lado; cada slot mapeia
// para o índice correspondente do array `dress`.
const FASHION_LEFT_COUNT = 12;   // 4 linhas × 3 colunas
const FASHION_RIGHT_COUNT = 12;  // 4 linhas × 3 colunas
const FASHION_TOTAL = FASHION_LEFT_COUNT + FASHION_RIGHT_COUNT;

// Mantido para compatibilidade com lógica de "extras" / editingLabel do equipamento real.
const SLOTS = [
  ...NORMAL_LEFT,
  ...NORMAL_RIGHT,
  ...NORMAL_BOTTOM,
];



type InvTab = "normal" | "roupas" | "provador";

/** Slots dos "Líderes" (cards de facção/contribuição) — estilo PW BR. */
const LEADER_SLOTS: { pos: number; idx: number }[] = [
  { pos: 20, idx: 0 },
  { pos: 21, idx: 1 },
  { pos: 22, idx: 2 },
  { pos: 23, idx: 3 },
  { pos: 24, idx: 4 },
  { pos: 25, idx: 5 },
];

const LEADER_POSITIONS = new Set(LEADER_SLOTS.map((s) => s.pos));

export const EquipmentTab = ({ template, onChange }: Props) => {
  const items = template.equipment.items;
  const [editingPos, setEditingPos] = useState<number | null>(null);
  const [pickerPos, setPickerPos] = useState<number | null>(null);
  // Demanda de "líderes necessários" — local apenas (não persistido na VPS).
  const [leadersNeeded, setLeadersNeeded] = useState<number>(10);
  const [sBonus, setSBonus] = useState<boolean>(false);
  const [invTab, setInvTab] = useState<InvTab>("normal");
  const [dressEditingIdx, setDressEditingIdx] = useState<number | null>(null);

  const byPos = new Map<number, ClsItem>();
  items.forEach((it) => byPos.set(it.pos, it));

  const upsertAt = (pos: number, next: ClsItem) => {
    const exists = items.some((it) => it.pos === pos);
    const nextItems = exists
      ? items.map((it) => (it.pos === pos ? next : it))
      : [...items, next].sort((a, b) => a.pos - b.pos);
    onChange({ ...template, equipment: { items: nextItems } });
  };

  const removeAt = (pos: number) => {
    onChange({
      ...template,
      equipment: { items: items.filter((it) => it.pos !== pos) },
    });
    setEditingPos(null);
  };

  const openSlot = (pos: number) => {
    // Slots de Líder abrem o seletor de War Avatar do .tab.
    // Demais slots abrem o editor genérico.
    if (LEADER_POSITIONS.has(pos)) {
      setPickerPos(pos);
      return;
    }
    if (!byPos.has(pos)) upsertAt(pos, newEmptyItem(pos));
    setEditingPos(pos);
  };

  const editing =
    editingPos != null ? byPos.get(editingPos) ?? newEmptyItem(editingPos) : null;

  const dollPositions = new Set(SLOTS.map((s) => s.pos));
  // "Slots extras" exclui o paper-doll e os líderes (que têm seu próprio bloco).
  const extras = items.filter(
    (it) => !dollPositions.has(it.pos) && !LEADER_POSITIONS.has(it.pos) && it.id > 0,
  );

  // Progresso do topo: % de slots equipados do paper-doll.
  const equippedCount = SLOTS.reduce(
    (n, s) => (byPos.get(s.pos)?.id ?? 0) > 0 ? n + 1 : n,
    0,
  );
  const progress = Math.round((equippedCount / SLOTS.length) * 100);

  const editingLabel =
    editingPos == null
      ? ""
      : SLOTS.find((s) => s.pos === editingPos)?.label
        ?? (LEADER_POSITIONS.has(editingPos) ? "Líder" : "extra");

  // Grid de slots extras (sempre mostra ao menos 32 caixas, no estilo da imagem)
  const EXTRA_GRID_SIZE = 32;
  const extrasByPos = new Map<number, ClsItem>();
  extras.forEach((it) => extrasByPos.set(it.pos, it));

  // Slots ativos conforme a aba. "Provador" usa as roupas para preview.
  const activeLeft   = invTab === "normal" ? NORMAL_LEFT   : [];
  const activeRight  = invTab === "normal" ? NORMAL_RIGHT  : [];
  const activeBottom = invTab === "normal" ? NORMAL_BOTTOM : [];

  // Roupas: lê direto do storehouse.dress (array de fashion do servidor PW).
  // Garante pelo menos FASHION_TOTAL slots renderizados (vazios viram placeholders).
  const dress = template.storehouse?.dress ?? [];
  const dressSlots: ClsItem[] = Array.from({ length: FASHION_TOTAL }, (_, i) =>
    dress[i] ?? newEmptyItem(i),
  );
  const dressLeft  = dressSlots.slice(0, FASHION_LEFT_COUNT);
  const dressRight = dressSlots.slice(FASHION_LEFT_COUNT, FASHION_TOTAL);

  const updateDressAt = (idx: number, next: ClsItem) => {
    const arr = dressSlots.map((it, i) => (i === idx ? next : it));
    onChange({
      ...template,
      storehouse: { ...template.storehouse, dress: arr },
    });
  };
  const removeDressAt = (idx: number) => {
    updateDressAt(idx, newEmptyItem(idx));
    setDressEditingIdx(null);
  };

  return (
    <div className="space-y-3">
      {/* Painel principal estilo cliente PW BR */}
      <div className="mx-auto w-full max-w-[480px]">
        {/* Cantoneiras + barra de progresso superior */}
        <div
          className="relative rounded-md p-3 pt-7"
          style={{
            background:
              "linear-gradient(180deg, hsl(195 30% 12%) 0%, hsl(205 35% 7%) 100%)",
            boxShadow:
              "inset 0 0 0 1px hsl(195 60% 35%), 0 0 0 1px hsl(0 0% 0%), inset 0 0 24px hsl(0 0% 0% / 0.6)",
          }}
        >
          {/* Cabeçalho com título "Inventário" e abas Normal/Roupas/Provador */}
          <div className="absolute -top-3 left-0 right-0 flex items-center justify-center">
            <div
              className="rounded-t-md px-6 py-1 text-[12px] font-bold tracking-widest text-amber-100"
              style={{
                background:
                  "linear-gradient(180deg, hsl(40 30% 28%) 0%, hsl(35 35% 18%) 100%)",
                boxShadow: "inset 0 0 0 1px hsl(40 60% 45%)",
              }}
            >
              INVENTÁRIO
            </div>
          </div>

          <div className="mb-3 flex items-center justify-center gap-2">
            {(["normal", "roupas", "provador"] as InvTab[]).map((t) => {
              const active = invTab === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInvTab(t)}
                  className="rounded-full px-4 py-1 text-[11px] font-bold uppercase tracking-wider transition-smooth"
                  style={
                    active
                      ? {
                          background:
                            "linear-gradient(180deg, hsl(40 35% 75%) 0%, hsl(40 30% 55%) 100%)",
                          color: "hsl(20 50% 15%)",
                          boxShadow:
                            "inset 0 0 0 1px hsl(40 60% 35%), 0 1px 3px hsl(0 0% 0% / 0.5)",
                        }
                      : {
                          background:
                            "linear-gradient(180deg, hsl(35 18% 22%) 0%, hsl(20 15% 12%) 100%)",
                          color: "hsl(40 25% 65%)",
                          boxShadow: "inset 0 0 0 1px hsl(40 30% 25%)",
                        }
                  }
                >
                  {t === "normal" ? "Normal" : t === "roupas" ? "Roupas" : "Provador"}
                </button>
              );
            })}
          </div>

          {/* Mini barra de % à esquerda */}
          <div className="mb-2 flex items-center gap-2">
            <div className="h-6 w-6 rounded-sm bg-amber-700/30 ring-1 ring-amber-500/40" />
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-black/40 ring-1 ring-amber-700/40">
                <div
                  className="h-full"
                  style={{
                    width: `${progress}%`,
                    background:
                      "linear-gradient(90deg, hsl(40 80% 55%) 0%, hsl(35 90% 65%) 100%)",
                  }}
                />
              </div>
            </div>
            <span className="font-mono text-[11px] font-bold text-amber-100">
              {progress.toFixed(1)}%
            </span>
          </div>

          {/* Paper-doll: col esquerda · silhueta · col direita */}
          <div
            className="relative rounded-sm p-3"
            style={{
              background:
                "radial-gradient(ellipse at center, hsl(35 18% 22%) 0%, hsl(20 15% 8%) 80%)",
              boxShadow:
                "inset 0 0 0 1px hsl(40 50% 35%), inset 0 0 32px hsl(0 0% 0% / 0.85)",
            }}
          >
            <div
              className="grid items-center gap-2"
              style={{ gridTemplateColumns: "auto 1fr auto" }}
            >
              {/* Col esquerda */}
              <div
                className={
                  invTab === "normal"
                    ? "flex flex-col gap-2"
                    : "grid grid-cols-3 gap-1.5"
                }
              >
                {invTab === "normal"
                  ? activeLeft.map((s) => {
                      const it = byPos.get(s.pos) ?? newEmptyItem(s.pos);
                      return (
                        <ItemSlot
                          key={s.pos}
                          item={it}
                          onClick={() => openSlot(s.pos)}
                          size={48}
                          emptyLabel={s.label}
                        />
                      );
                    })
                  : dressLeft.map((it, i) => (
                      <ItemSlot
                        key={`dl-${i}`}
                        item={it}
                        onClick={() => setDressEditingIdx(i)}
                        size={40}
                        emptyLabel="Roupa"
                      />
                    ))}
              </div>

              {/* Silhueta central */}
              <div className="relative flex items-center justify-center self-stretch px-1">
                <svg
                  viewBox="0 0 100 200"
                  className="h-full max-h-[260px] w-auto opacity-40"
                  fill="none"
                  stroke="hsl(40 60% 55%)"
                  strokeWidth="1.5"
                >
                  <circle cx="50" cy="22" r="14" />
                  <path d="M30 40 L70 40 L78 100 L66 130 L60 180 L40 180 L34 130 L22 100 Z" />
                  <path d="M22 100 L8 60 L4 70 L18 110 Z" />
                  <path d="M78 100 L92 60 L96 70 L82 110 Z" />
                  <path d="M40 180 L36 195 L46 195 Z" />
                  <path d="M60 180 L64 195 L54 195 Z" />
                </svg>
              </div>

              {/* Col direita */}
              <div
                className={
                  invTab === "normal"
                    ? "flex flex-col gap-2"
                    : "grid grid-cols-3 gap-1.5"
                }
              >
                {invTab === "normal"
                  ? activeRight.map((s) => {
                      const it = byPos.get(s.pos) ?? newEmptyItem(s.pos);
                      return (
                        <ItemSlot
                          key={s.pos}
                          item={it}
                          onClick={() => openSlot(s.pos)}
                          size={48}
                          emptyLabel={s.label}
                        />
                      );
                    })
                  : dressRight.map((it, i) => (
                      <ItemSlot
                        key={`dr-${i}`}
                        item={it}
                        onClick={() => setDressEditingIdx(FASHION_LEFT_COUNT + i)}
                        size={40}
                        emptyLabel="Roupa"
                      />
                    ))}
              </div>
            </div>

            {/* Linha inferior centralizada (Arma · Botas · Sub-arma · Anel E · Pet · Anel D) */}
            <div className="mt-3 flex items-center justify-center gap-2">
              {activeBottom.map((s) => {
                const it = byPos.get(s.pos) ?? newEmptyItem(s.pos);
                return (
                  <ItemSlot
                    key={s.pos}
                    item={it}
                    onClick={() => openSlot(s.pos)}
                    size={42}
                    emptyLabel={s.label}
                  />
                );
              })}
            </div>
          </div>

          {/* Bloco "Líderes" — 6 cards com nv. 0 + linha de necessários e S+ bônus */}
          <section className="mt-3">
            <div className="grid grid-cols-6 gap-2">
              {LEADER_SLOTS.map((ls) => {
                const it = byPos.get(ls.pos) ?? newEmptyItem(ls.pos);
                return (
                  <div key={ls.pos} className="flex flex-col items-center gap-1">
                    <ItemSlot
                      item={it}
                      onClick={() => openSlot(ls.pos)}
                      size={42}
                      emptyLabel="Líder"
                    />
                    <div className="flex items-baseline gap-1 text-[11px]">
                      <span className="text-amber-200/70">nv.</span>
                      <span className="font-mono font-bold text-amber-100">
                        {it.id > 0 ? it.count || 1 : 0}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <label className="flex items-center gap-2 text-amber-200/80">
                Líderes necessários
                <input
                  type="number"
                  min={0}
                  value={leadersNeeded}
                  onChange={(e) =>
                    setLeadersNeeded(Math.max(0, parseInt(e.target.value, 10) || 0))
                  }
                  className="w-12 border-b border-amber-200/40 bg-transparent px-1 text-center font-mono font-bold text-amber-100 outline-none focus:border-amber-300"
                />
                <span className="font-mono text-emerald-400/90">
                  ({equippedCount})
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-2 text-amber-200/80">
                <span>S+ bônus</span>
                <input
                  type="checkbox"
                  checked={sBonus}
                  onChange={(e) => setSBonus(e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer rounded-sm border border-amber-700/60 bg-black/40 accent-amber-400"
                />
              </label>
            </div>
          </section>

          {/* Slots extras — grid 8x4 estilo bag do cliente */}
          <section className="mt-3">
            <div
              className="grid grid-cols-8 gap-[3px] rounded-sm p-2"
              style={{
                background:
                  "linear-gradient(180deg, hsl(200 20% 10%), hsl(205 30% 6%))",
                boxShadow:
                  "inset 0 0 0 1px hsl(195 55% 35%), inset 0 0 16px hsl(0 0% 0% / 0.85)",
              }}
            >
              {Array.from({ length: EXTRA_GRID_SIZE }).map((_, i) => {
                // pos virtual sequencial a partir de 100 para extras editáveis
                const virtualPos = 100 + i;
                const real = extras[i];
                const it = real ?? newEmptyItem(virtualPos);
                return (
                  <ItemSlot
                    key={i}
                    item={it}
                    size={36}
                    onClick={() => openSlot(it.pos)}
                  />
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <Dialog open={editingPos != null} onOpenChange={(o) => !o && setEditingPos(null)}>
        <DialogContent className="max-w-xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span>
                Editar slot — pos {editingPos}
                {editingPos != null && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({editingLabel})
                  </span>
                )}
              </span>
              {editing && editing.id > 0 && (
                <button
                  type="button"
                  onClick={() => removeAt(editing.pos)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1 text-xs text-destructive transition-smooth hover:border-destructive/50"
                >
                  <X className="h-3 w-3" />
                  Esvaziar
                </button>
              )}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <ItemEditor
              item={editing}
              onChange={(next) => upsertAt(next.pos, next)}
              onRemove={() => removeAt(editing.pos)}
            />
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setEditingPos(null)}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-4 py-2 text-sm transition-smooth hover:border-primary/50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setEditingPos(null)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
            >
              Salvar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Editor para slot de Roupa (storehouse.dress) */}
      <Dialog
        open={dressEditingIdx != null}
        onOpenChange={(o) => !o && setDressEditingIdx(null)}
      >
        <DialogContent className="max-w-xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-2">
              <span>
                Editar roupa — slot {dressEditingIdx}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  (storehouse.dress)
                </span>
              </span>
              {dressEditingIdx != null && (dressSlots[dressEditingIdx]?.id ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => removeDressAt(dressEditingIdx)}
                  className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1 text-xs text-destructive transition-smooth hover:border-destructive/50"
                >
                  <X className="h-3 w-3" />
                  Esvaziar
                </button>
              )}
            </DialogTitle>
          </DialogHeader>
          {dressEditingIdx != null && (
            <ItemEditor
              item={dressSlots[dressEditingIdx]}
              onChange={(next) => updateDressAt(dressEditingIdx, next)}
              onRemove={() => removeDressAt(dressEditingIdx)}
            />
          )}
          <div className="flex justify-end gap-2 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setDressEditingIdx(null)}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow transition-smooth hover:brightness-110"
            >
              Fechar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <WarAvatarPicker
        open={pickerPos != null}
        onClose={() => setPickerPos(null)}
        contextLabel={pickerPos != null ? `Líder · pos ${pickerPos}` : undefined}
        onPick={(meta) => {
          if (pickerPos == null) return;
          const existing = byPos.get(pickerPos) ?? newEmptyItem(pickerPos);
          upsertAt(pickerPos, { ...existing, id: meta.id, count: Math.max(1, existing.count) });
        }}
      />
    </div>
  );
};
