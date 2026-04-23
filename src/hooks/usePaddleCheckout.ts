import { useState } from "react";
import { toast } from "sonner";
import { initializePaddle, getPaddlePriceId } from "@/lib/paddle";

interface CheckoutOptions {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  successUrl?: string;
}

export function usePaddleCheckout() {
  const [loading, setLoading] = useState(false);

  const openCheckout = async (options: CheckoutOptions) => {
    setLoading(true);
    try {
      await initializePaddle();
      const paddlePriceId = await getPaddlePriceId(options.priceId);

      // Listener de eventos do Paddle.js — feedback imediato sem esperar redirect.
      // Reatribui sempre que abre o checkout (Paddle.Initialize só registra 1 callback).
      window.Paddle.Update({
        eventCallback: (data: { name: string; data?: unknown }) => {
          if (data.name === "checkout.completed") {
            toast.success("Pagamento confirmado! Finalizando...", { duration: 4000 });
          } else if (data.name === "checkout.payment_failed") {
            toast.error("Pagamento recusado", {
              description:
                "O cartão foi recusado. Tente outro método ou cartão diferente.",
              duration: 8000,
            });
          } else if (data.name === "checkout.error") {
            toast.error("Erro no checkout", {
              description: "Algo deu errado. Tenta novamente em alguns segundos.",
              duration: 6000,
            });
          }
        },
      });

      window.Paddle.Checkout.open({
        items: [{ priceId: paddlePriceId, quantity: 1 }],
        customer: options.customerEmail ? { email: options.customerEmail } : undefined,
        customData: options.userId ? { userId: options.userId } : undefined,
        settings: {
          displayMode: "overlay",
          successUrl:
            options.successUrl || `${window.location.origin}/checkout/success`,
          allowLogout: false,
          variant: "one-page",
        },
      });
    } catch (e) {
      toast.error("Erro ao abrir checkout", {
        description: e instanceof Error ? e.message : "Tente novamente em alguns segundos.",
      });
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return { openCheckout, loading };
}
