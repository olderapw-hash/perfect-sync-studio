// Base URL pública dos ícones de classe servidos pelo servidor PW.
// Concatenada com `class_icon_path` retornado pela API.
export const ICON_BASE_URL = "http://93.127.143.77/";

export function buildClassIconUrl(iconPath?: string | null): string | null {
  if (!iconPath) return null;
  // Evita barra duplicada caso o path comece com "/"
  const clean = iconPath.replace(/^\/+/, "");
  return `${ICON_BASE_URL}${clean}`;
}
