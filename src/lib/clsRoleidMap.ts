// Mapeamento real cls → roleid no servidor PW.
// IMPORTANTE: nunca usar `cls` como roleid. Sempre traduzir via este mapa.
export const CLS_TO_ROLEID: Record<number, number> = {
  0: 16,
  1: 19,
  2: 20,
  3: 23,
  4: 24,
  5: 27,
  6: 28,
  7: 31,
  8: 18,
  9: 17,
  10: 21,
  11: 22,
};

export const ROLEID_TO_CLS: Record<number, number> = Object.fromEntries(
  Object.entries(CLS_TO_ROLEID).map(([cls, roleid]) => [roleid, Number(cls)]),
);

export function clsToRoleid(cls: number): number | undefined {
  return CLS_TO_ROLEID[cls];
}
