// Anexa o <link rel="manifest"> ao <head> SOMENTE enquanto o usuário está
// nas rotas do painel (/admin/* ou /trial/*). Em qualquer outra rota
// (landing, /pricing, /auth...) o manifest é removido — assim o navegador
// não oferece "instalar app" no site público.
//
// Também aplica o theme-color escuro e o apple-touch-icon enquanto está
// dentro do painel.
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const MANIFEST_ID = "pwa-manifest";
const APPLE_ICON_ID = "pwa-apple-icon";
const THEME_ID = "pwa-theme-color";
const APPLE_CAPABLE_ID = "pwa-apple-capable";
const APPLE_STATUS_ID = "pwa-apple-status";

function ensureLink(id: string, attrs: Record<string, string>) {
  let el = document.getElementById(id) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.id = id;
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
}

function ensureMeta(id: string, attrs: Record<string, string>) {
  let el = document.getElementById(id) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.id = id;
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
}

function removeById(id: string) {
  document.getElementById(id)?.remove();
}

export const PwaManifestGate = () => {
  const { pathname } = useLocation();
  const inApp =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/trial") ||
    pathname.startsWith("/download");

  useEffect(() => {
    if (inApp) {
      ensureLink(MANIFEST_ID, { rel: "manifest", href: "/manifest.webmanifest" });
      ensureLink(APPLE_ICON_ID, { rel: "apple-touch-icon", href: "/apple-touch-icon.png" });
      ensureMeta(THEME_ID, { name: "theme-color", content: "#0F172A" });
      ensureMeta(APPLE_CAPABLE_ID, { name: "apple-mobile-web-app-capable", content: "yes" });
      ensureMeta(APPLE_STATUS_ID, {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent",
      });
    } else {
      removeById(MANIFEST_ID);
      removeById(APPLE_ICON_ID);
      removeById(THEME_ID);
      removeById(APPLE_CAPABLE_ID);
      removeById(APPLE_STATUS_ID);
    }
  }, [inApp]);

  return null;
};
