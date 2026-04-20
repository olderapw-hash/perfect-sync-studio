import { Heart, Sparkles } from "lucide-react";
import { StarterChar } from "@/lib/api";
import { ItemsEditor } from "./ItemsEditor";
import { cn } from "@/lib/utils";

const CLASS_META: Record<string, { aura: string; icon: string }> = {
  Warrior:  { aura: "--class-warrior",  icon: "⚔" },
  Mage:     { aura: "--class-mage",     icon: "🔮" },
  Archer:   { aura: "--class-archer",   icon: "🏹" },
  Priest:   { aura: "--class-priest",   icon: "✨" },
  Assassin: { aura: "--class-assassin", icon: "🗡" },
};

interface CharCardProps {
  data: StarterChar;
  index: number;
  onChange: (next: StarterChar) => void;
}

export const CharCard = ({ data, index, onChange }: CharCardProps) => {
  const meta = CLASS_META[data.class] ?? { aura: "--class-default", icon: "🛡" };
  const auraStyle = { ["--aura" as string]: `hsl(var(${meta.aura}))` } as React.CSSProperties;

  return (
    <article
      style={{ ...auraStyle, animationDelay: `${index * 60}ms` }}
      className={cn(
        "group glass-card glass-card-hover relative overflow-hidden rounded-2xl p-0",
        "animate-fade-in-up transition-smooth"
      )}
    >
      {/* Header strip */}
      <header
        className="relative flex items-center justify-between px-5 py-4"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, rgba(15,15,15,0.6) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl text-xl ring-1 ring-white/10"
            style={{ background: `color-mix(in hsl, var(--aura) 20%, hsl(var(--card)))` }}
          >
            <span>{meta.icon}</span>
          </div>
          <div>
            <h3 className="text-xl font-extrabold tracking-tight text-primary">
              {data.class}
            </h3>
            <p className="text-[11px] font-mono text-muted-foreground">
              clsconfig · id 16
            </p>
          </div>
        </div>
        <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
          Inicial
        </span>
      </header>

      {/* Body */}
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-3">
          <StatField
            label="HP"
            icon={<Heart className="h-3.5 w-3.5" />}
            value={data.hp}
            color="text-destructive"
            onChange={(v) => onChange({ ...data, hp: v })}
          />
          <StatField
            label="MP"
            icon={<Sparkles className="h-3.5 w-3.5" />}
            value={data.mp}
            color="text-accent"
            onChange={(v) => onChange({ ...data, mp: v })}
          />
        </div>

        <ItemsEditor
          items={data.items}
          onChange={(items) => onChange({ ...data, items })}
        />
      </div>
    </article>
  );
};

interface StatFieldProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  color: string;
  onChange: (value: number) => void;
}

const StatField = ({ label, icon, value, color, onChange }: StatFieldProps) => (
  <label className="block">
    <span className="mb-1.5 flex items-center gap-1.5 uppercase-label">
      <span className={color}>{icon}</span>
      {label}
    </span>
    <input
      type="number"
      min={0}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className={cn(
        "w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5",
        "font-mono text-base font-bold text-foreground",
        "outline-none transition-smooth",
        "focus:border-primary focus:bg-white/[0.06]"
      )}
    />
  </label>
);
