import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Check, Clock, QrCode, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PixCheckoutModalProps {
  open: boolean;
  onClose: () => void;
  pixData: {
    qr_code: string;
    qr_code_base64: string;
    ticket_url: string;
    expires_at: string;
  } | null;
  status: string | null;
  checking: boolean;
  planName: string;
  amount: string;
}

export function PixCheckoutModal({
  open,
  onClose,
  pixData,
  status,
  checking,
  planName,
  amount,
}: PixCheckoutModalProps) {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  // Auto-redirect after payment confirmed
  useEffect(() => {
    if (status === "approved") {
      const t = setTimeout(() => {
        navigate("/onboarding", { state: { fromPayment: true } });
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [status, navigate]);

  if (!open || !pixData) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      toast.success("Código Pix copiado!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error("Falha ao copiar");
    }
  };

  const isApproved = status === "approved";
  const isExpired = status === "expired" || (pixData.expires_at && new Date(pixData.expires_at) < new Date());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15">
            <QrCode className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-lg font-extrabold">Pagar com Pix</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {planName} · {amount}
          </p>
        </div>

        {isApproved ? (
          <div className="text-center py-6">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <h4 className="text-lg font-bold text-emerald-400">Pagamento confirmado!</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Seu plano foi ativado por 30 dias.
            </p>
            <button
              onClick={() => {
                onClose();
                navigate("/onboarding", { state: { fromPayment: true } });
              }}
              className="mt-4 rounded-md bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110 transition-smooth"
            >
              Configurar meu servidor
            </button>
          </div>
        ) : isExpired ? (
          <div className="text-center py-6">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/15">
              <Clock className="h-8 w-8 text-destructive" />
            </div>
            <h4 className="text-lg font-bold text-destructive">QR Code expirado</h4>
            <p className="text-sm text-muted-foreground mt-2">
              Gere um novo código para pagar.
            </p>
            <button
              onClick={onClose}
              className="mt-4 rounded-md border border-border px-6 py-2.5 text-sm font-bold hover:bg-muted transition-smooth"
            >
              Fechar
            </button>
          </div>
        ) : (
          <>
            {/* QR Code */}
            <div className="mb-4 flex justify-center">
              {pixData.qr_code_base64 ? (
                <img
                  src={`data:image/png;base64,${pixData.qr_code_base64}`}
                  alt="QR Code Pix"
                  className="h-48 w-48 rounded-lg border border-border bg-white p-2"
                />
              ) : (
                <div className="flex h-48 w-48 items-center justify-center rounded-lg border border-border bg-muted">
                  <QrCode className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Pix copia e cola */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Pix Copia e Cola
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  readOnly
                  value={pixData.qr_code || ""}
                  className="flex-1 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs font-mono text-foreground truncate"
                />
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-md border border-border bg-card px-3 py-2 text-xs font-bold hover:bg-muted transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              {checking ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              <span>Aguardando pagamento... verificando automaticamente</span>
            </div>

            <p className="mt-3 text-center text-[11px] text-muted-foreground">
              O plano será ativado por 30 dias após a confirmação. Renovação manual todo mês.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
