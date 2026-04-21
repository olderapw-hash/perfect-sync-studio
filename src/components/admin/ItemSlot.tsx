import { useState } from "react";
import { Pencil } from "lucide-react";
import type { ClsItem } from "@/types/clsconfig";
import { useItemCatalog } from "@/context/ItemCatalogContext";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

interface Props {
  item: ClsItem;
  onClick?: () => void;
}

/** Slot único de inventário (estilo PWOld). Mostra ícone + count, tooltip on hover. */
export const ItemSlot = ({ item, onClick }: Props) => {
  const { iconUrlFor, metaFor, catalog } = useItemCatalog();
  const [iconBroken, setIconBroken] = useState(false);
  const empty = item.id <= 0;
  const meta = empty ? undefined : metaFor(item.id);
  const iconUrl = empty || !catalog ? "" : iconUrlFor(item.id);

  const slotInner = (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border transition-smooth",
        empty
          ? "border-border/40 bg-background/30 hover:border-border"
          : "border-primary/30 bg-card/60 hover:border-primary hover:shadow-glow",
      )}
      aria-label={empty ? `slot ${item.pos} vazio` : meta?.name ?? `item ${item.id}`}
    >
      {empty ? (
        <span className="font-mono text-[10px] text-muted-foreground/50">{item.pos}</span>
      ) : iconUrl && !iconBroken ? (
        <img
          src={iconUrl}
          alt=""
          loading="lazy"
          onError={() => setIconBroken(true)}
          className="h-full w-full object-contain"
        />
      ) : (
        <span className="px-1 text-center font-mono text-[10px] leading-tight text-foreground">
          {item.id}
        </span>
      )}

      {!empty && item.count > 1 && (
        <span className="absolute bottom-0.5 right-0.5 rounded bg-background/85 px-1 font-mono text-[10px] font-bold text-foreground shadow">
          {item.count}
        </span>
      )}

      {!empty && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 transition-smooth group-hover:opacity-100">
          <Pencil className="h-3.5 w-3.5 text-primary" />
        </span>
      )}
    </button>
  );

  if (empty) return slotInner;

  return (
    <HoverCard openDelay={120} closeDelay={50}>
      <HoverCardTrigger asChild>{slotInner}</HoverCardTrigger>
      <HoverCardContent className="w-72 border-primary/40 bg-popover/95 p-0 backdrop-blur-md">
        <div className="flex items-start gap-3 p-3">
          {iconUrl && !iconBroken ? (
            <img src={iconUrl} alt="" className="h-12 w-12 rounded border border-border object-contain" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded border border-border bg-card font-mono text-[11px] text-muted-foreground">
              {item.id}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div
              className="truncate text-sm font-bold"
              style={{ color: meta?.color ?? "#FFFFFF" }}
              title={meta?.name}
            >
              {meta?.name ?? `Item ${item.id}`}
            </div>
            <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">
              id {item.id} · pos {item.pos}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border/60 px-3 py-2 font-mono text-[11px]">
          <Row label="count" value={`${item.count}/${item.max_count || "∞"}`} />
          <Row label="proctype" value={item.proctype} />
          <Row label="expire" value={item.expire_date || "—"} />
          <Row label="mask" value={item.mask} />
          <Row label="guid1" value={item.guid1} />
          <Row label="guid2" value={item.guid2} />
        </div>
        {item.data && (
          <div className="border-t border-border/60 px-3 py-2">
            <div className="uppercase-label mb-1 text-[10px]">data (hex)</div>
            <div className="max-h-20 overflow-auto break-all font-mono text-[10px] text-muted-foreground">
              {item.data}
            </div>
          </div>
        )}
        {!meta && (
          <div className="border-t border-border/60 px-3 py-2 text-[11px] text-warning">
            Item não encontrado no catálogo .tab ativo.
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
};

const Row = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex items-baseline justify-between gap-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-foreground">{value}</span>
  </div>
);
