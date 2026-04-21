import { useState } from "react";
import { Pencil } from "lucide-react";
import type { ClsItem } from "@/types/clsconfig";
import { useItemCatalog } from "@/context/ItemCatalogContext";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface Props {
  item: ClsItem;
  onClick?: () => void;
  /** Tamanho do slot em px. Default 44 (estilo MyPers). */
  size?: number;
  /** Rótulo opcional desenhado por baixo do ícone quando vazio (ex: "Helm"). */
  emptyLabel?: string;
}

/**
 * Slot estilo MyPers/PW client:
 * - Moldura escura com gradiente metálico
 * - Borda dourada-fosca, brilha em hover
 * - Count no canto inferior direito
 * - Tooltip rico no estilo do jogo
 */
export const ItemSlot = ({ item, onClick, size = 44, emptyLabel }: Props) => {
  const { iconUrlFor, metaFor, catalog } = useItemCatalog();
  const [iconBroken, setIconBroken] = useState(false);
  const empty = item.id <= 0;
  const meta = empty ? undefined : metaFor(item.id);
  const iconUrl = empty || !catalog ? "" : iconUrlFor(item.id);

  // Cor da qualidade (vinda do catálogo .tab) define a borda quando preenchido.
  const qualityColor = meta?.color ?? undefined;

  const slotInner = (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: size,
        height: size,
        // Moldura "tile de pedra" estilo MyPers
        backgroundImage: empty
          ? "linear-gradient(145deg, hsl(0 0% 8%), hsl(0 0% 14%))"
          : "linear-gradient(145deg, hsl(0 0% 6%), hsl(0 0% 12%))",
        boxShadow: empty
          ? "inset 0 0 0 1px hsl(40 25% 22%), inset 0 2px 6px hsl(0 0% 0% / 0.6)"
          : `inset 0 0 0 1px ${qualityColor ?? "hsl(40 55% 45%)"}, inset 0 2px 6px hsl(0 0% 0% / 0.7), 0 0 0 1px hsl(0 0% 0%)`,
      }}
      className={cn(
        "group relative flex items-center justify-center overflow-hidden rounded-[3px] transition-[box-shadow,transform] duration-150",
        empty
          ? "hover:brightness-125"
          : "hover:z-10 hover:scale-[1.06]",
      )}
      aria-label={empty ? `slot ${item.pos} vazio` : meta?.name ?? `item ${item.id}`}
    >
      {empty ? (
        emptyLabel ? (
          <span className="px-1 text-center text-[8px] font-bold uppercase tracking-wider text-amber-200/30">
            {emptyLabel}
          </span>
        ) : (
          <span className="font-mono text-[9px] text-amber-100/15">{item.pos}</span>
        )
      ) : iconUrl && !iconBroken ? (
        <img
          src={iconUrl}
          alt=""
          loading="lazy"
          onError={() => setIconBroken(true)}
          className="h-[88%] w-[88%] object-contain drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]"
        />
      ) : (
        <span className="px-1 text-center font-mono text-[9px] leading-tight text-foreground">
          {item.id}
        </span>
      )}

      {!empty && item.count > 1 && (
        <span className="absolute bottom-0 right-0 rounded-tl bg-black/85 px-1 py-px font-mono text-[10px] font-bold leading-none text-amber-100 shadow">
          {item.count}
        </span>
      )}

      {!empty && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
          <Pencil className="h-3 w-3 text-amber-200" />
        </span>
      )}
    </button>
  );

  if (empty) {
    // Slot vazio também é clicável (para criar item) — mas não mostra tooltip.
    return slotInner;
  }

  return (
    <HoverCard openDelay={120} closeDelay={50}>
      <HoverCardTrigger asChild>{slotInner}</HoverCardTrigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={10}
        collisionPadding={16}
        avoidCollisions
        className="z-[100] w-72 rounded-sm border-0 p-0 shadow-2xl"
        style={{
          background: "linear-gradient(180deg, hsl(35 30% 8% / 0.96), hsl(20 25% 5% / 0.96))",
          boxShadow:
            "0 0 0 1px hsl(40 60% 45%), 0 0 0 2px hsl(0 0% 0%), 0 12px 32px hsl(0 0% 0% / 0.7)",
        }}
      >
        {/* Header dourado estilo PW */}
        <div className="border-b border-amber-700/40 px-3 py-2">
          <div
            className="text-sm font-bold leading-tight"
            style={{ color: qualityColor ?? "hsl(50 90% 70%)", textShadow: "0 1px 2px #000" }}
            title={meta?.name}
          >
            {meta?.name ?? `Item ${item.id}`}
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-amber-100/40">
            id {item.id} · pos {item.pos}
          </div>
        </div>

        <div className="flex items-start gap-3 px-3 py-2">
          <div
            className="shrink-0 rounded-[3px] p-px"
            style={{
              boxShadow: `inset 0 0 0 1px ${qualityColor ?? "hsl(40 55% 45%)"}`,
              background: "linear-gradient(145deg, hsl(0 0% 6%), hsl(0 0% 12%))",
            }}
          >
            {iconUrl && !iconBroken ? (
              <img src={iconUrl} alt="" className="h-12 w-12 object-contain" />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center font-mono text-[11px] text-amber-100/50">
                {item.id}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 font-mono text-[11px] leading-snug text-amber-50/85">
            <Row label="Qtd" value={`${item.count}/${item.max_count || "∞"}`} />
            <Row label="proctype" value={item.proctype} />
            <Row label="expire" value={item.expire_date || "—"} />
            <Row label="mask" value={item.mask} />
          </div>
        </div>

        {meta?.description && meta.description.length > 0 && (
          <div
            className="max-h-56 overflow-y-auto border-t border-amber-700/30 px-3 py-2 text-[12px] leading-snug"
            style={{ color: "hsl(45 30% 85%)" }}
          >
            {meta.description.map((para, pi) => (
              <p key={pi} className={pi > 0 ? "mt-1.5" : ""}>
                {para.map((seg, si) => (
                  <span key={si} style={seg.color ? { color: seg.color } : undefined}>
                    {seg.text}
                  </span>
                ))}
              </p>
            ))}
          </div>
        )}

        {item.data && (
          <div className="border-t border-amber-700/30 px-3 py-1.5">
            <div className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-200/60">
              data (hex)
            </div>
            <div className="max-h-16 overflow-auto break-all font-mono text-[9px] text-amber-100/40">
              {item.data}
            </div>
          </div>
        )}

        {!meta && (
          <div className="border-t border-amber-700/30 px-3 py-2 text-[11px] text-amber-300">
            Item não encontrado no catálogo .tab ativo.
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

const Row = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-baseline justify-between gap-2">
    <span className="text-amber-100/45">{label}</span>
    <span>{value}</span>
  </div>
);
