// Base URL pública dos ícones de classe servidos pelo servidor PW.
// Pode ser sobrescrita em runtime via app_settings (useAppSettings),
// mas o default fica aqui pra fallback enquanto o contexto carrega.
export const ICON_BASE_URL = "http://93.127.143.77/";

export function buildClassIconUrl(iconPath?: string | null, baseUrl?: string | null): string | null {
  if (!iconPath) return null;
  const base = (baseUrl || ICON_BASE_URL).replace(/\/+$/, "/") || ICON_BASE_URL;
  // Garante exatamente uma barra entre base e path
  const cleanBase = base.endsWith("/") ? base : `${base}/`;
  const clean = iconPath.replace(/^\/+/, "");
  return `${cleanBase}${clean}`;
}
