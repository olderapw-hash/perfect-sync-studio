// Mapeamentos do Perfect World (race/cls/gender) → nome legível + cor de classe.
// Códigos de race/cls baseados nos padrões clássicos do PW International.

export interface RaceInfo {
  name: string;
  classes: Record<number, ClassInfo>;
}

export interface ClassInfo {
  name: string;
  /** Cor base (HSL) usada como aura/borda do avatar. */
  color: string;
  short: string;
}

const C = {
  warrior: { color: "0 72% 55%", short: "GUE" }, // vermelho
  mage: { color: "260 78% 65%", short: "MAG" }, // roxo
  archer: { color: "140 60% 50%", short: "ARQ" }, // verde
  cleric: { color: "45 95% 60%", short: "CLE" }, // dourado
  werebeast: { color: "20 75% 55%", short: "BES" }, // laranja
  werefox: { color: "320 65% 60%", short: "FOX" }, // rosa
  assassin: { color: "280 50% 45%", short: "ASS" }, // roxo escuro
  psychic: { color: "200 70% 55%", short: "PSI" }, // azul
  seeker: { color: "30 80% 55%", short: "SEE" },
  mystic: { color: "150 55% 50%", short: "MYS" },
  duskblade: { color: "350 60% 45%", short: "DUS" },
  stormbringer: { color: "210 65% 55%", short: "STO" },
} as const;

// race 0 = Humano, 1 = Elfo (Wing Elf), 2 = Untamed, 3 = Tideborn, 4 = Earthguard, 5 = Nightshade
// cls dentro de cada race segue ordem padrão.
const RACES: Record<number, RaceInfo> = {
  0: {
    name: "Humano",
    classes: {
      0: { name: "Guerreiro", ...C.warrior },
      1: { name: "Mágico", ...C.mage },
    },
  },
  1: {
    name: "Elfo",
    classes: {
      2: { name: "Arqueiro", ...C.archer },
      3: { name: "Sacerdote", ...C.cleric },
    },
  },
  2: {
    name: "Untamed",
    classes: {
      4: { name: "Lupina", ...C.werebeast },
      5: { name: "Felina", ...C.werefox },
    },
  },
  3: {
    name: "Tideborn",
    classes: {
      6: { name: "Assassino", ...C.assassin },
      7: { name: "Aquariano", ...C.psychic },
    },
  },
  4: {
    name: "Earthguard",
    classes: {
      8: { name: "Buscador", ...C.seeker },
      9: { name: "Místico", ...C.mystic },
    },
  },
  5: {
    name: "Nightshade",
    classes: {
      10: { name: "Lâmina Crepuscular", ...C.duskblade },
      11: { name: "Conjuradora", ...C.stormbringer },
    },
  },
};

const FALLBACK_CLASS: ClassInfo = { name: "Desconhecida", color: "0 0% 50%", short: "???" };
const FALLBACK_RACE = "Desconhecida";

export function getRaceName(race: number): string {
  return RACES[race]?.name ?? FALLBACK_RACE;
}

export function getClassInfo(race: number, cls: number): ClassInfo {
  return RACES[race]?.classes[cls] ?? FALLBACK_CLASS;
}

export function getGenderInfo(gender: number): { label: string; symbol: string } {
  if (gender === 0) return { label: "Masculino", symbol: "♂" };
  if (gender === 1) return { label: "Feminino", symbol: "♀" };
  return { label: "—", symbol: "•" };
}

/** Iniciais para o avatar (até 2 letras). */
export function getInitials(name: string): string {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
