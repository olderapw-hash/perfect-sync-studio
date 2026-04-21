import { useMemo, useState } from "react";
import { ArrowLeft, Loader2, Search, ShieldAlert, Users } from "lucide-react";
import type { ClsEntry } from "@/types/clsconfig";
import { getClassInfo, getGenderInfo, getInitials, getRaceName } from "@/lib/pwClasses";
import { cn } from "@/lib/utils";

interface Props {
  entries: ClsEntry[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  loading?: boolean;
}

interface CharacterGroup {
  /** chave única race-cls-gender */
  id: string;
  race: number;
  cls: number;
  gender: number;
  entries: ClsEntry[];
}

export const ClsconfigList = ({ entries, selectedKey, onSelect, loading }: Props) => {
  const [q, setQ] = useState("");
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  // Agrupa por personagem (race + cls + gender)
  const groups = useMemo<CharacterGroup[]>(() => {
    const map = new Map<string, CharacterGroup>();
    for (const e of entries) {
      const { race, cls, gender } = e.template.summary;
      const id = `${race}-${cls}-${gender}`;
      let g = map.get(id);
      if (!g) {
        g = { id, race, cls, gender, entries: [] };
        map.set(id, g);
      }
      g.entries.push(e);
    }
    // ordena por race → cls → gender
    return Array.from(map.values()).sort((a, b) =>
      a.race - b.race || a.cls - b.cls || a.gender - b.gender,
    );
  }, [entries]);

  // Auto-abre o grupo do entry selecionado quando vier de fora
  useMemo(() => {
    if (!selectedKey) return;
    const found = entries.find((e) => e.key_hex === selectedKey);
    if (found) {
      const { race, cls, gender } = found.template.summary;
      const id = `${race}-${cls}-${gender}`;
      setOpenGroup((prev) => prev ?? id);
    }
  }, [selectedKey, entries]);

  const filteredGroups = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((g) => {
      const cls = getClassInfo(g.race, g.cls).name.toLowerCase();
      const race = getRaceName(g.race).toLowerCase();
      if (cls.includes(term) || race.includes(term)) return true;
      return g.entries.some((e) => e.template.summary.name.toLowerCase().includes(term));
    });
  }, [groups, q]);

  const activeGroup = openGroup ? groups.find((g) => g.id === openGroup) ?? null : null;

  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-card/40 backdrop-blur-md">
      <div className="border-b border-border p-4">
        <div className="mb-3 flex items-center gap-2">
          {activeGroup ? (
            <>
              <button
                type="button"
                onClick={() => setOpenGroup(null)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1 text-[11px] font-semibold transition-smooth hover:border-primary/50 hover:text-primary"
              >
                <ArrowLeft className="h-3 w-3" />
                Voltar
              </button>
              <h2 className="ml-1 truncate text-sm font-extrabold uppercase tracking-wider text-foreground">
                CLS desse personagem
              </h2>
            </>
          ) : (
            <>
              <Users className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
                Personagens iniciais
              </h2>
            </>
          )}
          <span className="ml-auto rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            {activeGroup ? activeGroup.entries.length : groups.length}
          </span>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={activeGroup ? "Buscar por nome do CLS…" : "Buscar por classe, raça…"}
            className="w-full rounded-lg border border-border bg-background/60 py-2 pl-8 pr-3 text-sm outline-none transition-smooth focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div className="flex items-center justify-center p-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : activeGroup ? (
          <ClsList
            group={activeGroup}
            search={q}
            selectedKey={selectedKey}
            onSelect={onSelect}
          />
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-xs text-muted-foreground">
            <ShieldAlert className="h-5 w-5 opacity-60" />
            Nenhum personagem encontrado.
          </div>
        ) : (
          <ul className="space-y-2">
            {filteredGroups.map((g) => (
              <li key={g.id}>
                <CharacterCard group={g} onOpen={() => setOpenGroup(g.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
};

/** Card grande de um personagem (race+cls+gender). */
const CharacterCard = ({ group, onOpen }: { group: CharacterGroup; onOpen: () => void }) => {
  const klass = getClassInfo(group.race, group.cls);
  const raceName = getRaceName(group.race);
  const gender = getGenderInfo(group.gender);
  const count = group.entries.length;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-xl border border-border bg-background/40 p-3 text-left transition-smooth hover:-translate-y-0.5 hover:border-primary/40 hover:bg-background/60 hover:shadow-glow"
    >
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: `hsl(${klass.color})` }}
      />
      <div className="flex items-center gap-3 pl-1.5">
        <div
          className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border text-base font-extrabold text-white shadow-md"
          style={{
            background: `linear-gradient(135deg, hsl(${klass.color} / 0.9), hsl(${klass.color} / 0.55))`,
            borderColor: `hsl(${klass.color} / 0.6)`,
            textShadow: "0 1px 2px rgba(0,0,0,0.5)",
          }}
        >
          {klass.short}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className="truncate text-sm font-extrabold"
              style={{ color: `hsl(${klass.color})` }}
            >
              {klass.name}
            </span>
            <span
              className="text-sm leading-none"
              title={gender.label}
              style={{
                color: group.gender === 0 ? "hsl(210 80% 65%)" : "hsl(330 70% 70%)",
              }}
            >
              {gender.symbol}
            </span>
          </div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">{raceName}</div>
          <div className="mt-1 flex items-center gap-1">
            <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-bold text-primary">
              {count} CLS
            </span>
          </div>
        </div>
      </div>
    </button>
  );
};

/** Lista os CLS de um grupo (depois que o usuário abre um personagem). */
const ClsList = ({
  group,
  search,
  selectedKey,
  onSelect,
}: {
  group: CharacterGroup;
  search: string;
  selectedKey: string | null;
  onSelect: (key: string) => void;
}) => {
  const klass = getClassInfo(group.race, group.cls);
  const raceName = getRaceName(group.race);
  const gender = getGenderInfo(group.gender);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return group.entries;
    return group.entries.filter((e) =>
      e.template.summary.name.toLowerCase().includes(term),
    );
  }, [group.entries, search]);

  return (
    <div className="space-y-2">
      {/* header do personagem ativo */}
      <div
        className="flex items-center gap-3 rounded-xl border p-3"
        style={{
          borderColor: `hsl(${klass.color} / 0.5)`,
          background: `linear-gradient(135deg, hsl(${klass.color} / 0.12), transparent)`,
        }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-extrabold text-white shadow"
          style={{
            background: `linear-gradient(135deg, hsl(${klass.color} / 0.9), hsl(${klass.color} / 0.55))`,
            borderColor: `hsl(${klass.color} / 0.6)`,
          }}
        >
          {klass.short}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5 text-sm font-extrabold">
            <span style={{ color: `hsl(${klass.color})` }}>{klass.name}</span>
            <span
              style={{
                color: group.gender === 0 ? "hsl(210 80% 65%)" : "hsl(330 70% 70%)",
              }}
            >
              {gender.symbol}
            </span>
          </div>
          <div className="text-[11px] text-muted-foreground">{raceName}</div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-6 text-center text-xs text-muted-foreground">
          <ShieldAlert className="h-5 w-5 opacity-60" />
          Nenhum CLS para esse filtro.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {filtered.map((e) => {
            const t = e.template;
            const active = e.key_hex === selectedKey;
            const initials = getInitials(t.summary.name);
            return (
              <li key={e.key_hex}>
                <button
                  type="button"
                  onClick={() => onSelect(e.key_hex)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-smooth",
                    active
                      ? "border-primary/70 bg-primary/10 shadow-glow"
                      : "border-border bg-background/40 hover:border-primary/40 hover:bg-background/60",
                  )}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold text-white"
                    style={{
                      background: `linear-gradient(135deg, hsl(${klass.color} / 0.85), hsl(${klass.color} / 0.5))`,
                    }}
                  >
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold text-foreground">
                      {t.summary.name || "(sem nome)"}
                    </div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      lvl {t.summary.level} · cult {t.summary.level2} · v{e.version}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
