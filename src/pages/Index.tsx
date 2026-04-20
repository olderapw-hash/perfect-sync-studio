import { useEffect, useState } from "react";
import { Loader2, Save, RefreshCw, CheckCircle2, AlertCircle, Download } from "lucide-react";
import { getChars, updateChars, StarterChar } from "@/lib/api";
import { CharCard } from "@/components/CharCard";
import { SyncHeader } from "@/components/SyncHeader";
import { cn } from "@/lib/utils";

type SyncStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "saving" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string };

const Index = () => {
  const [chars, setChars] = useState<StarterChar[]>([]);
  const [status, setStatus] = useState<SyncStatus>({ kind: "loading" });
  const [dirty, setDirty] = useState(false);

  const load = async () => {
    setStatus({ kind: "loading" });
    try {
      const data = await getChars();
      setChars(data);
      setDirty(false);
      setStatus({ kind: "idle" });
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Falha ao carregar personagens",
      });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const updateAt = (index: number, next: StarterChar) => {
    setChars((prev) => prev.map((c, i) => (i === index ? next : c)));
    setDirty(true);
  };

  const handleSave = async () => {
    setStatus({ kind: "saving" });
    try {
      await updateChars(chars);
      setDirty(false);
      setStatus({ kind: "success", message: "Sincronizado com sucesso" });
      setTimeout(() => {
        setStatus((s) => (s.kind === "success" ? { kind: "idle" } : s));
      }, 3500);
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Falha ao salvar alterações",
      });
    }
  };

  const isBusy = status.kind === "loading" || status.kind === "saving";

  const totalItems = chars.reduce((sum, c) => sum + c.items.length, 0);

  return (
    <main className="min-h-screen bg-hero pb-40">
      <SyncHeader totalClasses={chars.length} totalItems={totalItems} />

      <section className="mx-auto max-w-6xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold uppercase tracking-wider text-foreground">Classes</h2>
            <p className="text-sm text-muted-foreground">
              {chars.length > 0
                ? `${chars.length} classes carregadas`
                : "Nenhuma classe carregada"}
            </p>
          </div>
          <button
            onClick={load}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card/60 px-3 py-2 text-sm text-foreground transition-smooth hover:border-primary/50 hover:text-primary disabled:opacity-50"
          >
            <RefreshCw className={cn("h-4 w-4", status.kind === "loading" && "animate-spin")} />
            Recarregar
          </button>
        </div>

        {status.kind === "loading" && chars.length === 0 ? (
          <div className="flex items-center justify-center rounded-xl border border-border bg-card-gradient py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : status.kind === "error" && chars.length === 0 ? (
          <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4" />
              Erro ao carregar
            </div>
            <p className="mt-1 text-destructive/80">{status.message}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {chars.map((c, i) => (
              <CharCard key={c.class} data={c} index={i} onChange={(next) => updateAt(i, next)} />
            ))}
          </div>
        )}

        <section className="mt-12 rounded-xl border border-border bg-card-gradient p-6">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-accent" />
            <h3 className="font-display text-base font-semibold">Scripts PHP do servidor</h3>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Baixe e coloque no diretório <span className="font-mono text-accent">/api/</span> do seu servidor web.
            O painel consumirá <span className="font-mono">get_chars.php</span> e{" "}
            <span className="font-mono">update_chars.php</span> automaticamente.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="/api/get_chars.php"
              download
              className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm transition-smooth hover:border-primary/50 hover:text-primary"
            >
              <Download className="h-4 w-4" />
              get_chars.php
            </a>
            <a
              href="/api/update_chars.php"
              download
              className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm transition-smooth hover:border-primary/50 hover:text-primary"
            >
              <Download className="h-4 w-4" />
              update_chars.php
            </a>
          </div>
          <p className="mt-3 text-[12px] leading-relaxed text-muted-foreground">
            Os scripts leem/gravam em <span className="font-mono">chars.json</span> no mesmo diretório
            (ajuste conforme sua integração real com o banco). CORS já vem liberado. Para apontar o
            painel para o servidor, defina{" "}
            <span className="font-mono text-accent">VITE_API_BASE_URL=https://seudominio.com/api</span>{" "}
            e rebuild.
          </p>
        </section>
      </section>

      {/* Barra fixa de salvar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto flex max-w-6xl items-center justify-end px-4 pb-6">
          <div
            className={cn(
              "pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-card/90 px-3 py-2 backdrop-blur-md shadow-elegant transition-smooth",
              dirty && "border-primary/50 shadow-glow"
            )}
          >
            <StatusPill status={status} dirty={dirty} />
            <button
              onClick={handleSave}
              disabled={!dirty || isBusy}
              className={cn(
                "inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2 text-sm font-semibold text-primary-foreground",
                "shadow-glow transition-smooth hover:brightness-110",
                "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              )}
            >
              {status.kind === "saving" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar alterações
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

const StatusPill = ({ status, dirty }: { status: SyncStatus; dirty: boolean }) => {
  if (status.kind === "success") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {status.message}
      </span>
    );
  }
  if (status.kind === "error") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-destructive/15 px-3 py-1 text-xs font-medium text-destructive">
        <AlertCircle className="h-3.5 w-3.5" />
        {status.message}
      </span>
    );
  }
  if (status.kind === "saving") {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Sincronizando…
      </span>
    );
  }
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium transition-smooth",
        dirty ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
      )}
    >
      {dirty ? "Alterações não salvas" : "Tudo sincronizado"}
    </span>
  );
};

export default Index;
