// Painel de validação de itens — exibido antes do botão Salvar.
// Separa erros (críticos + erros) e avisos. Permite clicar pra abrir o slot.
import { AlertTriangle, AlertOctagon, Info, ChevronRight } from "lucide-react";
import type { ItemIssue, ValidationSummary } from "@/lib/validateItem";
import { cn } from "@/lib/utils";

interface Props {
  summary: ValidationSummary;
  /** Disparado quando o usuário clica num issue — UI deve abrir a tab/slot. */
  onIssueClick?: (issue: ItemIssue) => void;
  /** Quando true, esconde o painel se não houver issue algum. */
  hideWhenClean?: boolean;
  className?: string;
}

export const ValidationPanel = ({
  summary,
  onIssueClick,
  hideWhenClean,
  className,
}: Props) => {
  const { errors, warnings, criticals } = summary;
  const totalErrors = errors.length + criticals.length;
  const totalWarnings = warnings.length;

  if (hideWhenClean && totalErrors === 0 && totalWarnings === 0) return null;

  const headline =
    totalErrors > 0
      ? `${totalErrors} ${totalErrors === 1 ? "erro impede" : "erros impedem"} salvar`
      : `0 erros, ${totalWarnings} ${totalWarnings === 1 ? "aviso" : "avisos"}`;

  const headlineTone =
    totalErrors > 0
      ? "text-destructive"
      : totalWarnings > 0
      ? "text-yellow-500"
      : "text-emerald-500";

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background/40 p-3",
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="uppercase-label">Validação</h4>
        <span className={cn("text-xs font-semibold", headlineTone)}>
          {headline}
        </span>
      </div>

      {totalErrors === 0 && totalWarnings === 0 ? (
        <p className="text-xs text-muted-foreground">
          Todas as listas de itens passaram nas regras de validação.
        </p>
      ) : (
        <div className="space-y-3 text-sm">
          {criticals.length > 0 && (
            <IssueGroup
              tone="critical"
              title={`Críticos (${criticals.length})`}
              issues={criticals}
              onIssueClick={onIssueClick}
            />
          )}
          {errors.length > 0 && (
            <IssueGroup
              tone="error"
              title={`Erros (${errors.length})`}
              issues={errors}
              onIssueClick={onIssueClick}
            />
          )}
          {warnings.length > 0 && (
            <IssueGroup
              tone="warning"
              title={`Avisos (${warnings.length})`}
              issues={warnings}
              onIssueClick={onIssueClick}
            />
          )}
        </div>
      )}
    </div>
  );
};

interface GroupProps {
  tone: "critical" | "error" | "warning";
  title: string;
  issues: ItemIssue[];
  onIssueClick?: (issue: ItemIssue) => void;
}

const IssueGroup = ({ tone, title, issues, onIssueClick }: GroupProps) => {
  const Icon =
    tone === "critical" ? AlertOctagon : tone === "error" ? AlertTriangle : Info;
  const toneClass =
    tone === "critical"
      ? "text-destructive"
      : tone === "error"
      ? "text-destructive"
      : "text-yellow-500";

  return (
    <div>
      <div className={cn("mb-1.5 flex items-center gap-1.5", toneClass)}>
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wide">{title}</span>
      </div>
      <ul className="space-y-1">
        {issues.slice(0, 50).map((issue, i) => (
          <li key={`${issue.section}-${issue.index}-${issue.field}-${i}`}>
            <button
              type="button"
              onClick={onIssueClick ? () => onIssueClick(issue) : undefined}
              disabled={!onIssueClick}
              className={cn(
                "group flex w-full items-start justify-between gap-2 rounded-md border border-transparent px-2 py-1 text-left text-xs",
                onIssueClick &&
                  "cursor-pointer transition-smooth hover:border-border hover:bg-card/60",
              )}
            >
              <span className="font-mono">{issue.message}</span>
              {onIssueClick && (
                <ChevronRight className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground transition-smooth group-hover:text-foreground" />
              )}
            </button>
          </li>
        ))}
        {issues.length > 50 && (
          <li className="px-2 py-1 text-xs text-muted-foreground">
            …e mais {issues.length - 50} item(ns) — veja o console para a lista completa.
          </li>
        )}
      </ul>
    </div>
  );
};
