import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Eraser, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import {
  SECTION_LABELS,
  SECTIONS_WITH_MONEY,
  type SectionKey,
  type SectionPreview,
} from "@/lib/clearSection";

const NO_CLEAR_TIP = "Seu acesso não permite limpar seções.";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: SectionKey;
  preview: SectionPreview;
  /** Confirmação aceita — devolve as opções escolhidas. */
  onConfirm: (opts: { clearMoney: boolean }) => void;
}

export const ClearSectionDialog = ({
  open,
  onOpenChange,
  section,
  preview,
  onConfirm,
}: Props) => {
  const { can } = useServerPermissions();
  const canClear = can("clear_sections");
  const label = SECTION_LABELS[section];
  const supportsMoney = preview.hasMoney && SECTIONS_WITH_MONEY.includes(section);
  const expectedPhrase = useMemo(() => `LIMPAR ${label.toUpperCase()}`, [label]);

  const [confirmText, setConfirmText] = useState("");
  const [clearMoney, setClearMoney] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmText("");
      setClearMoney(false);
      setSubmitting(false);
    }
  }, [open]);

  const matches = confirmText.trim().toUpperCase() === expectedPhrase;

  const handleConfirm = () => {
    if (!canClear) return;
    if (!matches || submitting) return;
    setSubmitting(true);
    try {
      onConfirm({ clearMoney: supportsMoney && clearMoney });
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-destructive/40 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Limpar seção: {label}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Isso transforma todos os slots em vazios. As alterações ficam apenas
            no editor — o backup só é criado quando você clicar em Salvar.
          </DialogDescription>
        </DialogHeader>

        {!canClear && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{NO_CLEAR_TIP}</span>
          </div>
        )}

        {/* Preview do impacto */}
        <div className="space-y-2 rounded-md border border-border bg-background/40 p-3 text-xs">
          <Row label="Seção alvo" value={label} mono={false} />
          <Row
            label="Itens que serão removidos"
            value={`${preview.filledSlots} de ${preview.totalSlots} slots`}
          />
          <Row
            label="Capacidade preservada"
            value={preview.capacity > 0 ? `${preview.capacity}` : "—"}
          />
          {supportsMoney && (
            <Row
              label="Dinheiro atual"
              value={preview.money.toLocaleString("pt-BR")}
            />
          )}
        </div>

        {/* Opções */}
        {supportsMoney && (
          <div className="flex items-start gap-2 rounded-md border border-border bg-background/40 p-3">
            <Checkbox
              id="clear-money"
              checked={clearMoney}
              onCheckedChange={(v) => setClearMoney(v === true)}
            />
            <Label htmlFor="clear-money" className="cursor-pointer text-xs">
              <span className="font-semibold text-foreground">
                Limpar também o dinheiro
              </span>
              <span className="block text-muted-foreground">
                Define <code className="font-mono">money = 0</code>. Sem isso,
                apenas os itens são esvaziados.
              </span>
            </Label>
          </div>
        )}

        {/* Confirmação forte */}
        <div className="space-y-1.5">
          <Label htmlFor="confirm-input" className="text-xs">
            Para confirmar, digite{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] text-destructive">
              {expectedPhrase}
            </code>
          </Label>
          <Input
            id="confirm-input"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={expectedPhrase}
            autoComplete="off"
            className="font-mono"
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!matches || submitting || !canClear}
            title={!canClear ? NO_CLEAR_TIP : undefined}
          >
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Eraser className="mr-2 h-4 w-4" />
            )}
            Limpar {label}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <div className="flex items-center justify-between gap-3">
    <span className="text-muted-foreground">{label}</span>
    <span className={mono ? "font-mono text-foreground" : "text-foreground"}>
      {value}
    </span>
  </div>
);
