import { useMemo, useState } from "react";
import { Search, Users, ShieldAlert, Loader2 } from "lucide-react";
import type { ClsEntry } from "@/types/clsconfig";
import { getClassInfo, getGenderInfo, getInitials, getRaceName } from "@/lib/pwClasses";
import { cn } from "@/lib/utils";

interface Props {
  entries: ClsEntry[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  loading?: boolean;
}

export const ClsconfigList = ({ entries, selectedKey, onSelect, loading }: Props) => {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return entries;
    return entries.filter((e) => {
      const t = e.template;
      const cls = getClassInfo(t.summary.race, t.summary.cls).name.toLowerCase();
      const race = getRaceName(t.summary.race).toLowerCase();
      return (
        t.summary.name.toLowerCase().includes(term) ||
        cls.includes(term) ||
        race.includes(term)
      );
    });
  }, [entries, q]);

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card/40 backdrop-blur-md">
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
            Personagens iniciais
          </h2>
          <span className="ml-auto rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[10px] font-mono text-muted-foreground">
            {entries.length}
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, classe, raça…"
            className="w-full rounded-lg border border-border bg-background/60 py-2 pl-8 pr-3 text-sm outline-none transition-smooth focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center p-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-xs text-muted-foreground">
            <ShieldAlert className="h-5 w-5 opacity-60" />
            Nenhum personagem encontrado.
          </div>
        ) : (
          <ul className="space-y-2">
            {filtered.map((e) => {
              const t = e.template;
              const active = e.key_hex === selectedKey;
              const klass = getClassInfo(t.summary.race, t.summary.cls);
              const raceName = getRaceName(t.summary.race);
              const gender = getGenderInfo(t.summary.gender);
              const initials = getInitials(t.summary.name);

              return (
                <li key={e.key_hex}>
                  <button
                    onClick={() => onSelect(e.key_hex)}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-xl border p-3 text-left transition-smooth",
                      active
                        ? "border-primary/70 bg-primary/5 shadow-glow"
                        : "border-border bg-background/40 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background/60",
                    )}
                  >
                    {/* faixa lateral colorida da classe */}
                    <span
                      className="absolute inset-y-0 left-0 w-1"
                      style={{ background: `hsl(${klass.color})` }}
                    />

                    <div className="flex items-center gap-3 pl-1.5">
                      {/* avatar grande com gradient da cor da classe */}
                      <div
                        className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border text-base font-extrabold text-white shadow-md"
                        style={{
                          background: `linear-gradient(135deg, hsl(${klass.color} / 0.9), hsl(${klass.color} / 0.55))`,
                          borderColor: `hsl(${klass.color} / 0.6)`,
                          textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                        }}
                      >
                        {initials}
                        <span
                          className="absolute -bottom-1 -right-1 rounded bg-background/90 px-1 py-0.5 text-[9px] font-bold leading-none"
                          style={{ color: `hsl(${klass.color})` }}
                        >
                          {klass.short}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-1.5">
                          <span className="truncate text-sm font-extrabold text-foreground">
                            {t.summary.name || "(sem nome)"}
                          </span>
                          <span
                            className="text-sm leading-none"
                            title={gender.label}
                            aria-label={gender.label}
                            style={{
                              color: t.summary.gender === 0 ? "hsl(210 80% 65%)" : "hsl(330 70% 70%)",
                            }}
                          >
                            {gender.symbol}
                          </span>
                        </div>
                        <div
                          className="mt-0.5 truncate text-xs font-semibold"
                          style={{ color: `hsl(${klass.color})` }}
                        >
                          {klass.name}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className="rounded bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {raceName}
                          </span>
                          <span className="rounded bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            v{e.version}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
};
