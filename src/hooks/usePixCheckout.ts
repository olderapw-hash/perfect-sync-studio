import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PixPaymentData {
  id: string;
  qr_code: string;
  qr_code_base64: string;
  ticket_url: string;
  expires_at: string;
  mp_payment_id: string;
}

interface UsePixCheckoutReturn {
  createPixPayment: (opts: {
    priceId: string;
    productId: string;
    amountCents: number;
    environment: string;
  }) => Promise<void>;
  checkPaymentStatus: () => Promise<string>;
  pixData: PixPaymentData | null;
  loading: boolean;
  checking: boolean;
  status: string | null;
  reset: () => void;
}

export function usePixCheckout(): UsePixCheckoutReturn {
  const [pixData, setPixData] = useState<PixPaymentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const createPixPayment = async (opts: {
    priceId: string;
    productId: string;
    amountCents: number;
    environment: string;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-pix-payment", {
        body: opts,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPixData(data);
      setStatus("pending");
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao gerar QR Code Pix", {
        description: e.message || "Tente novamente.",
      });
      throw e;
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = useCallback(async () => {
    if (!pixData?.id) return "pending";
    setChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-pix-payment", {
        body: { pixPaymentId: pixData.id },
      });
      if (error) throw error;
      const newStatus = data?.status || "pending";
      setStatus(newStatus);
      return newStatus;
    } catch (e) {
      console.error(e);
      return "pending";
    } finally {
      setChecking(false);
    }
  }, [pixData?.id]);

  const reset = () => {
    setPixData(null);
    setStatus(null);
  };

  // Auto-poll every 5 seconds while pending
  useEffect(() => {
    if (!pixData || status !== "pending") return;
    const interval = setInterval(async () => {
      const s = await checkPaymentStatus();
      if (s === "approved") {
        clearInterval(interval);
        toast.success("Pagamento confirmado! 🎉", {
          description: "Seu plano foi ativado com sucesso.",
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [pixData, status, checkPaymentStatus]);

  return {
    createPixPayment,
    checkPaymentStatus,
    pixData,
    loading,
    checking,
    status,
    reset,
  };
}
