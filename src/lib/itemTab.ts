// Parser do arquivo .tab exportado do Perfect World (formato TSV).
// Layout observado (ACE_Exported_Table.tab):
//   col 0: id (numérico)
//   col 1: cor (hex RRGGBB) — usado como cor do nome
//   col 2: nome localizado (pode ter prefixos como ☆)
//   col 3: descrição (geralmente vazia nesse export)
//   col 4..: flags / ids auxiliares
//
// Mantemos só o essencial pro UI: id, name, color, raw (linha original
// caso queiramos ler outras colunas depois).

export interface ItemMeta {
  id: number;
  name: string;
  /** Cor do nome em #RRGGBB (default branco). */
  color: string;
  /** Linha original (debug/extensão). */
  raw?: string;
}

export type ItemCatalogMap = Map<number, ItemMeta>;

const HEX_RE = /^[0-9a-fA-F]{6}$/;

const cleanName = (s: string): string => {
  // remove caractere de marcação inicial (☆, ★, ♦, etc.)
  return s.replace(/^[\s\u2605\u2606\u2666\u2663\u2660\u2665]+/, "").trim();
};

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
    map.set(idNum, { id: idNum, name, color, raw: line });
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
