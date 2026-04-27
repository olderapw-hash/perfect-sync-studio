import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Registra service worker mínimo APENAS em produção e fora de iframe/preview.
// Necessário pra Chrome/Edge dispararem beforeinstallprompt (botão "Instalar app").
// O SW não faz cache — só existe pra habilitar a instalação.
const isInIframe = (() => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
})();

const isPreviewHost =
  window.location.hostname.includes("id-preview--") ||
  window.location.hostname.includes("lovableproject.com") ||
  window.location.hostname === "localhost";

if (isPreviewHost || isInIframe) {
  // Em preview/iframe: garante que nenhum SW antigo fique pendurado.
  navigator.serviceWorker?.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
} else if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* ignore — instalação via prompt nativo simplesmente não vai aparecer */
    });
  });
}
