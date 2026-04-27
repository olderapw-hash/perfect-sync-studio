// Service worker mínimo — existe só pra cumprir o critério de instalabilidade
// do Chrome/Edge (que exige um SW registrado pra disparar beforeinstallprompt).
// NÃO faz cache de nada, NÃO intercepta navegação. App continua 100% online.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handler de fetch vazio. Chrome exige que exista pra considerar o site instalável,
// mas como não chamamos respondWith(), o navegador segue o fluxo normal de rede.
self.addEventListener("fetch", () => {
  // no-op
});
