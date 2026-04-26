// Aba "Skills" — placeholder. O blob `status.skills` é binário proprietário
// (int32 count + N x [int32 id, int32 level]) e ainda não foi reverse-engineered
// com segurança. Esta tela mostra o estado bruto (read-only) e instruções.
// Persistência segura virá quando tivermos um dump real para validar o decode.
import { Sparkles, Info, AlertTriangle } from "lucide-react";
import type { ClsTemplate } from "@/types/clsconfig";

interface Props {
  template: ClsTemplate;
}

export const SkillsTab = ({ template }: Props) => {
  const blob = template.status.skills ?? "";
  const sizeBytes = Math.floor(blob.length / 2); // hex → bytes (~aprox)

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border-2 border-primary/40 bg-primary/5 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-1.5 text-sm">
          <p className="font-bold uppercase tracking-wider text-primary">
            Edição de skills em construção
          </p>
          <p className="text-bronze-muted">
            O campo <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-xs">status.skills</code> é
            um blob binário proprietário (formato Perfect World:{" "}
            <code className="font-mono text-xs">int32 count + N × [int32 id, int32 level]</code>).
          </p>
          <p className="text-xs text-bronze-muted/90">
            Aguardando dump real de <code className="font-mono">status.skills</code> de um personagem
            com skills conhecidas (ex.: todas lvl 10) para implementação segura do decode/encode com
            backup automático antes de cada save.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-bronze-soft/60 bg-card/30 p-4">
        <h4 className="uppercase-label mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5" />
          Blob atual (read-only)
        </h4>
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] text-bronze-muted">
          <span className="rounded-md border border-bronze-soft/50 bg-black/30 px-2 py-0.5 font-mono">
            {blob.length.toLocaleString()} chars
          </span>
          <span className="rounded-md border border-bronze-soft/50 bg-black/30 px-2 py-0.5 font-mono">
            ~{sizeBytes.toLocaleString()} bytes
          </span>
          {!blob && <span className="italic opacity-70">vazio</span>}
        </div>
        <textarea
          readOnly
          rows={8}
          value={blob}
          className="w-full cursor-not-allowed rounded-lg border border-border bg-background/40 px-3 py-2 font-mono text-[11px] leading-relaxed text-bronze-muted/80 outline-none"
          spellCheck={false}
        />
        <p className="mt-2 flex items-start gap-1.5 text-[11px] text-bronze-muted">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          Para editar agora, use a aba <strong className="text-bronze">Status</strong> → seção{" "}
          <em>Blobs (raw)</em> e edite o hex manualmente (avançado, sem validação).
        </p>
      </section>
    </div>
  );
};
