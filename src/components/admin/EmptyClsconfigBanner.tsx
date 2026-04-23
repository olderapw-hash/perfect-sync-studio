import { useState } from "react";
import { AlertTriangle, Loader2, PlugZap, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pwApi } from "@/lib/pwApiActions";

/**
 * Banner de diagnóstico exibido no Admin quando o endpoint
 * `getClsconfig` responde com `success:true` mas devolve `entries: []`
 * (count = 0). Não bloqueia a UI: o sidebar ainda renderiza as classes
 * marcadas como "sem template" e o admin pode continuar navegando.
 *
 * Inclui um botão "Testar roleids padrão" que chama
 * `pwApi.getRolesEditable` em paralelo para os roleids 16..24, 27, 28, 31
 * (faixa default de templates iniciais do PW). O resultado ajuda a
 * separar dois cenários:
 *
 *   - Se algum getRoleEditable RESPONDER com success → o gamedbd está
 *     OK e o problema está em `clsconfig_template_roleids` ou no
 *     próprio getClsconfig.
 *   - Se TODOS falharem → a leitura do gamedbd via api_cls.php está
 *     quebrada na VPS (gamedbd offline, secret errado etc.).
 */
const DEFAULT_PROBE_ROLEIDS = [16, 17, 18, 19, 20, 21, 22, 23, 24, 27, 28, 31];

interface ProbeResult {
  roleid: number;
  success: boolean;
  online?: boolean;
  error?: string;
}

interface Props {
  /** Total devolvido pelo PHP (campo `count` ou entries.length). */
  count: number;
  /** Tamanho real do array entries normalizado. */
  entriesLength: number;
  /** True se a API devolveu pelo menos uma classe (catálogo populado). */
  hasClasses: boolean;
  /** Tenant/server ativo no momento da chamada (id curto suficiente). */
  tenantId: string | null;
  /** Endpoint usado pelo proxy (informativo, não chamado daqui). */
  endpoint: string;
  /** JSON bruto pra debug avançado. */
  rawResponse: unknown;
}

export const EmptyClsconfigBanner = ({
  count,
  entriesLength,
  hasClasses,
  tenantId,
  endpoint,
  rawResponse,
}: Props) => {
  const [probeLoading, setProbeLoading] = useState(false);
  const [probe, setProbe] = useState<ProbeResult[] | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);

  const handleProbe = async () => {
    setProbeLoading(true);
    setProbeError(null);
    setProbe(null);
    try {
      const results = await pwApi.getRolesEditable(DEFAULT_PROBE_ROLEIDS);
      setProbe(results);
    } catch (e) {
      setProbeError(e instanceof Error ? e.message : String(e));
    } finally {
      setProbeLoading(false);
    }
  };

  const succeeded = probe?.filter((r) => r.success) ?? [];
  const failed = probe?.filter((r) => !r.success) ?? [];

  return (
    <div className="space-y-4 rounded-xl border border-warning/40 bg-warning/10 p-5 text-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="space-y-1">
          <p className="font-bold uppercase tracking-wider text-warning">
            API respondeu, mas nenhum template CLS foi retornado
          </p>
          <p className="text-foreground/90">
            O endpoint{" "}
            <code className="rounded bg-background/60 px-1 font-mono text-xs">
              {endpoint}
            </code>{" "}
            respondeu com <code className="font-mono">success:true</code> e{" "}
            <code className="font-mono">count = {count}</code>. As classes
            abaixo continuam acessíveis, mas todas estão marcadas como{" "}
            <span className="font-bold">"sem template"</span> até que a VPS
            devolva entries.
          </p>
        </div>
      </div>

      {/* Campos de debug */}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-md border border-border/60 bg-background/40 p-3 text-xs sm:grid-cols-3">
        <DebugField label="count" value={String(count)} />
        <DebugField label="entries.length" value={String(entriesLength)} />
        <DebugField label="has classes" value={hasClasses ? "true" : "false"} />
        <DebugField
          label="server_id"
          value={tenantId ? `${tenantId.slice(0, 8)}…` : "(nenhum)"}
          title={tenantId ?? undefined}
        />
        <DebugField label="endpoint" value={endpoint} className="col-span-2" />
      </dl>

      {/* Botão de probe */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleProbe}
          disabled={probeLoading}
        >
          {probeLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <PlugZap className="h-3.5 w-3.5" />
          )}
          {probeLoading ? "Testando…" : "Testar roleids padrão"}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          Tenta <code className="font-mono">getRoleEditable</code> em{" "}
          {DEFAULT_PROBE_ROLEIDS.join(", ")}.
        </span>
      </div>

      {probeError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
          {probeError}
        </div>
      )}

      {probe && (
        <div className="space-y-3">
          {/* Sugestão baseada no resultado */}
          <div
            className={
              succeeded.length > 0
                ? "rounded-md border border-primary/40 bg-primary/10 p-3 text-xs text-foreground"
                : "rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive"
            }
          >
            {succeeded.length > 0 ? (
              <p>
                <span className="font-bold">
                  {succeeded.length}/{probe.length} roleids responderam OK.
                </span>{" "}
                O gamedbd está acessível — provável{" "}
                <span className="font-bold">
                  problema no getClsconfig / roleids configurados
                </span>{" "}
                (verifique <code className="font-mono">clsconfig_template_roleids</code>{" "}
                no PHP).
              </p>
            ) : (
              <p>
                <span className="font-bold">Todos os {probe.length} roleids falharam.</span>{" "}
                Provável{" "}
                <span className="font-bold">
                  problema na leitura do gamedbd / API da VPS
                </span>{" "}
                (gamedbd offline, secret errado ou api_cls.php fora do ar).
              </p>
            )}
          </div>

          {/* Grid com cada roleid testado */}
          <ul className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
            {probe.map((r) => (
              <li
                key={r.roleid}
                className={
                  r.success
                    ? "flex items-center gap-1.5 rounded border border-primary/30 bg-primary/5 px-2 py-1 text-[11px]"
                    : "flex items-center gap-1.5 rounded border border-destructive/30 bg-destructive/5 px-2 py-1 text-[11px]"
                }
                title={r.error}
              >
                {r.success ? (
                  <CheckCircle2 className="h-3 w-3 shrink-0 text-primary" />
                ) : (
                  <XCircle className="h-3 w-3 shrink-0 text-destructive" />
                )}
                <span className="font-mono font-bold">{r.roleid}</span>
                {r.online && (
                  <span className="ml-auto rounded bg-destructive/20 px-1 text-[9px] font-bold text-destructive">
                    ONLINE
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Detalhes de erro (colapsado por padrão via <details>) */}
          {failed.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
                Ver mensagens de erro ({failed.length})
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-background/60 p-3 font-mono text-[10px] text-foreground/80">
                {failed
                  .map((r) => `roleid ${r.roleid}: ${r.error ?? "(sem mensagem)"}`)
                  .join("\n")}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* JSON bruto */}
      <details>
        <summary className="cursor-pointer text-[11px] text-muted-foreground hover:text-foreground">
          Ver JSON bruto da resposta
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-background/60 p-3 font-mono text-[10px] text-foreground/80">
          {JSON.stringify(rawResponse, null, 2)}
        </pre>
      </details>
    </div>
  );
};

const DebugField = ({
  label,
  value,
  className,
  title,
}: {
  label: string;
  value: string;
  className?: string;
  title?: string;
}) => (
  <div className={className} title={title}>
    <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </dt>
    <dd className="truncate font-mono text-foreground">{value}</dd>
  </div>
);
