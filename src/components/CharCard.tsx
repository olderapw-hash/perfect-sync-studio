import { Heart, Sparkles, Shield } from "lucide-react";
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
        "group relative overflow-hidden rounded-xl border border-border bg-card-gradient p-5",
        "shadow-elegant transition-smooth animate-fade-in-up",
        "hover:border-primary/40 hover:shadow-glow"
      )}
    >
      {/* Aura decorativa */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full opacity-30 blur-3xl transition-smooth group-hover:opacity-50"
        style={{ background: `var(--aura)` }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, var(--aura), transparent)` }}
      />

      <header className="relative mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-lg text-xl ring-1 ring-border"
            style={{ background: `color-mix(in hsl, var(--aura) 18%, hsl(var(--card)))` }}
          >
            <span>{meta.icon}</span>
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold tracking-wide text-foreground">
              {data.class}
            </h3>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              clsconfig · id 16
            </p>
          </div>
        </div>
        <Shield className="h-4 w-4 text-muted-foreground/60" />
      </header>

      <div className="relative grid grid-cols-2 gap-3">
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

      <div className="relative mt-4">
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
    <span className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
      <span className={color}>{icon}</span>
      {label}
    </span>
    <input
      type="number"
      min={0}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)}
      className={cn(
        "w-full rounded-md border border-border bg-input/60 px-3 py-2",
        "font-mono text-base font-semibold text-foreground",
        "outline-none transition-smooth focus:border-primary/60 focus:shadow-glow"
      )}
    />
  </label>
);
