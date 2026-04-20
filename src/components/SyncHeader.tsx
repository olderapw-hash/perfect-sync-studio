import { Swords } from "lucide-react";
import { USE_MOCK, API_BASE_URL } from "@/lib/api";

export const SyncHeader = () => (
  <header className="relative">
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-10 text-center md:py-14">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold shadow-glow">
          <Swords className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-display text-sm uppercase tracking-[0.3em] text-primary/90">
          Perfect World · Sync
        </span>
      </div>
      <h1 className="font-display text-3xl font-bold leading-tight text-glow-gold md:text-5xl">
        Painel de Personagens Iniciais
      </h1>
      <p className="max-w-xl text-sm text-muted-foreground md:text-base">
        Gerencie HP, MP e itens iniciais das classes vinculadas ao{" "}
        <span className="font-mono text-accent">clsconfig id 16</span>.
      </p>
      <div className="ornate-divider mt-2 w-48" />
      <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-3 py-1 text-[11px] text-muted-foreground">
        <span className={`h-1.5 w-1.5 rounded-full ${USE_MOCK ? "bg-accent animate-pulse-glow" : "bg-success"}`} />
        {USE_MOCK
          ? "Modo demo (mock local) — configure VITE_API_BASE_URL"
          : `API: ${API_BASE_URL}`}
      </div>
    </div>
  </header>
);
