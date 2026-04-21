// Parser do arquivo .tab exportado do Perfect World (formato TSV).
// Layout observado (ACE_Exported_Table.tab):
//   col 0: id (numérico)
//   col 1: cor (hex RRGGBB) — usado como cor do nome
//   col 2: nome localizado (pode ter prefixos como ☆)
//   col 3: descrição com markup PW (^RRGGBB para cor inline, \r para quebra)
//   col 4..6: flags
//   col 7: vazio
//   col 8: lista de ids auxiliares (refinos/sets)

export interface DescSegment {
  text: string;
  color?: string; // #RRGGBB
}
export type DescParagraph = DescSegment[];

export interface ItemMeta {
  id: number;
  name: string;
  /** Cor do nome em #RRGGBB (default branco). */
  color: string;
  /** Descrição parseada em parágrafos (cada parágrafo = lista de segmentos coloridos). */
  description?: DescParagraph[];
  /** Texto cru da descrição, útil pra debug. */
  descriptionRaw?: string;
  /** Linha original (debug/extensão). */
  raw?: string;
}

export type ItemCatalogMap = Map<number, ItemMeta>;

const HEX_RE = /^[0-9a-fA-F]{6}$/;
const INLINE_COLOR_RE = /\^([0-9a-fA-F]{6})/;

const cleanName = (s: string): string => {
  // remove caractere de marcação inicial (☆, ★, ♦, etc.)
  return s.replace(/^[\s\u2605\u2606\u2666\u2663\u2660\u2665]+/, "").trim();
};

/** Parseia o markup do PW: ^RRGGBB muda cor; \r quebra linha. */
export function parseDescription(raw: string): DescParagraph[] {
  if (!raw) return [];
  // O export usa \r (literal) como quebra. Também aceita \n caso venha normalizado.
  const paragraphs = raw.split(/\\r|\r|\n/).map((p) => p.trim()).filter(Boolean);
  return paragraphs.map((p) => {
    const segments: DescSegment[] = [];
    let cursor = 0;
    let currentColor: string | undefined;
    while (cursor < p.length) {
      const rest = p.slice(cursor);
      const m = rest.match(INLINE_COLOR_RE);
      if (!m || m.index === undefined) {
        segments.push({ text: rest, color: currentColor });
        break;
      }
      if (m.index > 0) {
        segments.push({ text: rest.slice(0, m.index), color: currentColor });
      }
      currentColor = `#${m[1]}`;
      cursor += m.index + m[0].length;
    }
    return segments.filter((s) => s.text.length > 0);
  });
}

export function parseItemTab(content: string): ItemCatalogMap {
  const map: ItemCatalogMap = new Map();
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    if (!line.trim()) continue;
    if (line.startsWith("#") || line.startsWith("//")) continue;
    const cols = line.split("\t");
    if (cols.length < 3) continue;
    const idNum = parseInt(cols[0], 10);
    if (!Number.isFinite(idNum) || idNum <= 0) continue;
    const colorRaw = (cols[1] ?? "").trim();
    const color = HEX_RE.test(colorRaw) ? `#${colorRaw}` : "#FFFFFF";
    const name = cleanName(cols[2] ?? "");
    const descRaw = (cols[3] ?? "").trim();
    const description = descRaw ? parseDescription(descRaw) : undefined;
    map.set(idNum, {
      id: idNum,
      name,
      color,
      description,
      descriptionRaw: descRaw || undefined,
      raw: line,
    });
  }
  return map;
}

export function buildIconUrl(
  publicBase: string,
  iconsPrefix: string,
  itemId: number,
): string {
  // ex: https://xxx.supabase.co/storage/v1/object/public/pw-assets/icons/12345.jpg
  const base = publicBase.replace(/\/+$/, "");
  const prefix = iconsPrefix.replace(/^\/+|\/+$/g, "");
  return `${base}/${prefix}/${itemId}.jpg`;
}
