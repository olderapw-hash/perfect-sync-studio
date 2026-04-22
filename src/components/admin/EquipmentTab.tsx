import type { ClsItem, ClsTemplate } from "@/types/clsconfig";
import { newEmptyItem } from "@/lib/clsconfig";
import { ItemSlot } from "./ItemSlot";
import { ItemEditor } from "./ItemEditor";
import { WarAvatarPicker } from "./WarAvatarPicker";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { X } from "lucide-react";
import { buildClassIconUrl } from "@/lib/pwIcons";
import { getClassInfo, getInitials } from "@/lib/pwClasses";
import { useCharacterPhoto } from "@/hooks/useCharacterPhoto";
import { uploadCharacterPhoto, uploadClassPhoto, removeCharacterPhoto } from "@/lib/photos";
import { PhotoUploadButton } from "./PhotoUploadButton";

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
// Layout PW BR — slots dispostos em duas colunas duplas ao redor do retrato.
// Topo: capacete centralizado.
const NORMAL_TOP: { pos: number; label: string } = { pos: 0, label: "ELMO" };

// Coluna esquerda — duas sub-colunas (externa, interna)
const NORMAL_LEFT_OUTER: { pos: number; label: string }[] = [
  { pos: 10, label: "MANTO" },
  { pos: 6,  label: "ANEL ESQ." },
  { pos: 3,  label: "CINTO" },
];
const NORMAL_LEFT_INNER: { pos: number; label: string }[] = [
  { pos: 2,  label: "ARMADURA" },
  { pos: 14, label: "BRAÇADEIRAS" },
  { pos: 4,  label: "CALÇAS" },
  { pos: 5,  label: "BOTAS" },
];

// Coluna direita — duas sub-colunas (interna, externa)
const NORMAL_RIGHT_INNER: { pos: number; label: string }[] = [
  { pos: 1,  label: "COLAR" },
  { pos: 15, label: "RUNA" },
  { pos: 13, label: "AMULETO" },
  { pos: 11, label: "HIERO" },
];
const NORMAL_RIGHT_OUTER: { pos: number; label: string }[] = [
  { pos: 8,  label: "ARMA" },
  { pos: 17, label: "TOMO" },
  { pos: 18, label: "MUNIÇÃO" },
  { pos: 12, label: "VOO" },
];

// Linha inferior (loja · espírito · anel dir)
const NORMAL_BOTTOM_ROW: { pos: number; label: string }[] = [
  { pos: 19, label: "LOJA" },
  { pos: 9,  label: "ESPÍRITO" },
  { pos: 7,  label: "ANEL DIR." },
];

// Roupas (fashion) — vêm de template.storehouse.dress.
const FASHION_LEFT_COUNT = 12;
const FASHION_RIGHT_COUNT = 12;
const FASHION_TOTAL = FASHION_LEFT_COUNT + FASHION_RIGHT_COUNT;

// Lista plana usada para progresso/lookup de label.
const SLOTS = [
  NORMAL_TOP,
  ...NORMAL_LEFT_OUTER,
  ...NORMAL_LEFT_INNER,
  ...NORMAL_RIGHT_INNER,
  ...NORMAL_RIGHT_OUTER,
  ...NORMAL_BOTTOM_ROW,
];



type InvTab = "normal" | "roupas" | "provador";

/** Slots dos "Líderes" (cards de facção/contribuição) — estilo PW BR. */
const LEADER_SLOTS: { pos: number; idx: number }[] = [
  { pos: 50, idx: 0 },
  { pos: 51, idx: 1 },
  { pos: 52, idx: 2 },
  { pos: 53, idx: 3 },
  { pos: 54, idx: 4 },
  { pos: 55, idx: 5 },
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

  // Roupas: lê direto do storehouse.dress (array de fashion do servidor PW).
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

  // Dados da classe → retrato central
  const classInfo = getClassInfo(template.summary.race, template.summary.cls);
  const classIconUrl = buildClassIconUrl(template.summary.class_icon_path);
  const className = template.summary.class_name ?? classInfo.name;
  const charName = template.summary.name || template.base?.name || "";

  // Foto resolvida (override personagem → foto da classe → fallback API)
  const photo = useCharacterPhoto({
    roleid: template.roleid,
    cls: template.summary.cls,
    fallbackUrl: classIconUrl,
  });

  const handleUploadCharacter = async (file: File) => {
    if (!template.roleid) {
      throw new Error("Personagem sem roleid — use 'Foto da classe' no menu.");
    }
    await uploadCharacterPhoto(template.roleid, file);
    photo.reload();
  };
  const handleUploadClass = async (file: File) => {
    await uploadClassPhoto(template.summary.cls, file);
    photo.reload();
  };
  const handleRemoveCharacter = async () => {
    if (!template.roleid) return;
    await removeCharacterPhoto(template.roleid);
    photo.reload();
  };

  /** Renderiza um slot equipamento com label PW BR acima. */
  const LabeledSlot = ({ pos, label, size = 44 }: { pos: number; label: string; size?: number }) => {
    const it = byPos.get(pos) ?? newEmptyItem(pos);
    return (
      <div className="flex flex-col items-center gap-0.5">
        <span
          className="text-[9px] font-bold uppercase tracking-wider"
          style={{ color: "hsl(40 45% 65%)", letterSpacing: "0.08em" }}
        >
          {label}
        </span>
        <div
          className="rounded-[3px] p-[2px]"
          style={{
            background:
              "linear-gradient(180deg, hsl(35 25% 18%) 0%, hsl(20 18% 8%) 100%)",
            boxShadow:
              "inset 0 0 0 1px hsl(40 45% 30%), 0 1px 2px hsl(0 0% 0% / 0.6)",
          }}
        >
          <ItemSlot
            item={it}
            onClick={() => openSlot(pos)}
            size={size}
            emptyLabel=""
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Painel principal estilo cliente PW BR */}
      <div className="mx-auto w-full max-w-[520px]">
        <div
          className="relative rounded-md p-3 pt-7"
          style={{
            background:
              "linear-gradient(180deg, hsl(35 30% 14%) 0%, hsl(25 35% 8%) 100%)",
            boxShadow:
              "inset 0 0 0 1px hsl(40 60% 38%), 0 0 0 1px hsl(0 0% 0%), inset 0 0 24px hsl(0 0% 0% / 0.6)",
          }}
        >
          {/* Cabeçalho "TELA DE EQUIPAMENTO / INVENTÁRIO" */}
          <div className="mb-2 text-center">
            <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-amber-200/70">
              Tela de Equipamento
            </div>
            <div
              className="text-[22px] font-bold tracking-[0.2em] text-amber-100"
              style={{ fontFamily: "'Cinzel', 'Trajan Pro', serif", textShadow: "0 2px 4px hsl(0 0% 0% / 0.6)" }}
            >
              INVENTÁRIO
            </div>
          </div>

          {/* Abas Normal/Roupas/Provador (estilo "EQUIPADOS / ARQUEIRO" da ref) */}
          <div className="mb-3 flex items-center justify-center gap-2">
            {(["normal", "roupas", "provador"] as InvTab[]).map((t) => {
              const active = invTab === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setInvTab(t)}
                  className="rounded-full px-5 py-1 text-[11px] font-bold uppercase tracking-wider transition-smooth"
                  style={
                    active
                      ? {
                          background:
                            "linear-gradient(180deg, hsl(45 80% 60%) 0%, hsl(38 65% 42%) 100%)",
                          color: "hsl(20 60% 12%)",
                          boxShadow:
                            "inset 0 0 0 1px hsl(40 80% 70%), 0 1px 3px hsl(0 0% 0% / 0.6)",
                        }
                      : {
                          background: "transparent",
                          color: "hsl(40 35% 65%)",
                          boxShadow: "inset 0 0 0 1px hsl(40 30% 30%)",
                        }
                  }
                >
                  {t === "normal" ? "Equipados" : t === "roupas" ? "Roupas" : "Provador"}
                </button>
              );
            })}
          </div>

          {/* Painel interno escuro */}
          <div
            className="relative rounded-sm p-3"
            style={{
              background:
                "radial-gradient(ellipse at center, hsl(30 20% 14%) 0%, hsl(20 18% 6%) 85%)",
              boxShadow:
                "inset 0 0 0 1px hsl(40 50% 30%), inset 0 0 32px hsl(0 0% 0% / 0.85)",
            }}
          >
            {invTab === "normal" ? (
              <>
                {/* Topo: ELMO centralizado */}
                <div className="mb-2 flex justify-center">
                  <LabeledSlot pos={NORMAL_TOP.pos} label={NORMAL_TOP.label} size={44} />
                </div>

                {/* Linha principal: col esq dupla · retrato · col dir dupla */}
                <div
                  className="grid items-start gap-2"
                  style={{ gridTemplateColumns: "auto auto 1fr auto auto" }}
                >
                  {/* Col esq externa */}
                  <div className="flex flex-col gap-2 pt-4">
                    {NORMAL_LEFT_OUTER.map((s) => (
                      <LabeledSlot key={s.pos} pos={s.pos} label={s.label} />
                    ))}
                  </div>
                  {/* Col esq interna */}
                  <div className="flex flex-col gap-2">
                    {NORMAL_LEFT_INNER.map((s) => (
                      <LabeledSlot key={s.pos} pos={s.pos} label={s.label} />
                    ))}
                  </div>

                  {/* Retrato central da classe */}
                  <div className="relative flex items-center justify-center px-1">
                    <div
                      className="relative w-full overflow-hidden"
                      style={{
                        aspectRatio: "3 / 4",
                        maxWidth: 180,
                        borderTopLeftRadius: 999,
                        borderTopRightRadius: 999,
                        borderBottomLeftRadius: 6,
                        borderBottomRightRadius: 6,
                        background:
                          "radial-gradient(ellipse at top, hsl(30 25% 18%) 0%, hsl(20 18% 6%) 90%)",
                        boxShadow: `inset 0 0 0 2px hsl(${classInfo.color} / 0.5), inset 0 0 24px hsl(0 0% 0% / 0.7), 0 0 18px hsl(${classInfo.color} / 0.25)`,
                      }}
                    >
                      {photo.url ? (
                        <img
                          src={photo.url}
                          alt={className}
                          loading="lazy"
                          className="h-full w-full object-cover object-top"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-3xl font-bold"
                          style={{ color: `hsl(${classInfo.color})` }}
                        >
                          {getInitials(charName || className)}
                        </div>
                      )}

                      {/* Overlay de upload (canto sup. direito) */}
                      <div className="absolute right-1.5 top-1.5 flex flex-col items-end gap-1">
                        <PhotoUploadButton
                          iconOnly
                          label={template.roleid ? "Trocar foto deste personagem" : "Trocar foto da classe"}
                          onUpload={template.roleid ? handleUploadCharacter : handleUploadClass}
                          onRemove={
                            template.roleid && photo.source === "character"
                              ? handleRemoveCharacter
                              : undefined
                          }
                        />
                        {photo.source !== "none" && (
                          <span
                            className="rounded-sm px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider"
                            style={{
                              background: "hsl(0 0% 0% / 0.7)",
                              color:
                                photo.source === "character"
                                  ? "hsl(140 60% 65%)"
                                  : photo.source === "class"
                                    ? "hsl(45 80% 65%)"
                                    : "hsl(0 0% 60%)",
                            }}
                          >
                            {photo.source === "character"
                              ? "char"
                              : photo.source === "class"
                                ? "classe"
                                : "padrão"}
                          </span>
                        )}
                      </div>

                      {/* Faixa inferior com nome + nível */}
                      <div
                        className="absolute inset-x-0 bottom-0 flex items-center justify-between px-2 py-1 text-[10px]"
                        style={{
                          background:
                            "linear-gradient(180deg, transparent 0%, hsl(20 25% 6% / 0.95) 60%)",
                        }}
                      >
                        <div className="flex flex-col leading-tight">
                          <span className="font-bold text-amber-100">
                            {charName || "—"}
                          </span>
                          <span
                            className="text-[9px] uppercase tracking-wider"
                            style={{ color: `hsl(${classInfo.color})` }}
                          >
                            {className}
                          </span>
                        </div>
                        <span
                          className="rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-bold"
                          style={{
                            background:
                              "linear-gradient(180deg, hsl(45 80% 55%), hsl(38 65% 38%))",
                            color: "hsl(20 60% 12%)",
                          }}
                        >
                          LV {template.status?.level ?? 1}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Col dir interna */}
                  <div className="flex flex-col gap-2">
                    {NORMAL_RIGHT_INNER.map((s) => (
                      <LabeledSlot key={s.pos} pos={s.pos} label={s.label} />
                    ))}
                  </div>
                  {/* Col dir externa */}
                  <div className="flex flex-col gap-2 pt-4">
                    {NORMAL_RIGHT_OUTER.map((s) => (
                      <LabeledSlot key={s.pos} pos={s.pos} label={s.label} />
                    ))}
                  </div>
                </div>

                {/* Linha inferior */}
                <div className="mt-3 flex items-start justify-center gap-6">
                  {NORMAL_BOTTOM_ROW.map((s) => (
                    <LabeledSlot key={s.pos} pos={s.pos} label={s.label} />
                  ))}
                </div>
              </>
            ) : (
              /* Aba Roupas / Provador — grid 4×3 de cada lado do retrato */
              <div
                className="grid items-center gap-2"
                style={{ gridTemplateColumns: "auto 1fr auto" }}
              >
                <div className="grid grid-cols-3 gap-1.5">
                  {dressLeft.map((it, i) => (
                    <ItemSlot
                      key={`dl-${i}`}
                      item={it}
                      onClick={() => setDressEditingIdx(i)}
                      size={40}
                      emptyLabel="Roupa"
                    />
                  ))}
                </div>

                <div className="relative flex items-center justify-center px-1">
                  <div
                    className="relative w-full overflow-hidden"
                    style={{
                      aspectRatio: "3 / 4",
                      maxWidth: 160,
                      borderTopLeftRadius: 999,
                      borderTopRightRadius: 999,
                      borderBottomLeftRadius: 6,
                      borderBottomRightRadius: 6,
                      background:
                        "radial-gradient(ellipse at top, hsl(30 25% 18%) 0%, hsl(20 18% 6%) 90%)",
                      boxShadow: `inset 0 0 0 2px hsl(${classInfo.color} / 0.5), inset 0 0 24px hsl(0 0% 0% / 0.7)`,
                    }}
                  >
                    {photo.url ? (
                      <img
                        src={photo.url}
                        alt={className}
                        loading="lazy"
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-2xl font-bold"
                        style={{ color: `hsl(${classInfo.color})` }}
                      >
                        {getInitials(charName || className)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {dressRight.map((it, i) => (
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
            )}
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
