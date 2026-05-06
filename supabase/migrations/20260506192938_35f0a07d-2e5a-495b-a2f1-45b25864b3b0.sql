
-- Tabela para rastrear pagamentos Pix via Mercado Pago
CREATE TABLE public.pix_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  environment TEXT NOT NULL DEFAULT 'live',
  status TEXT NOT NULL DEFAULT 'pending',
  amount_cents INTEGER NOT NULL,
  product_id TEXT NOT NULL,
  price_id TEXT NOT NULL,
  mp_payment_id TEXT,
  mp_external_reference TEXT NOT NULL,
  qr_code TEXT,
  qr_code_base64 TEXT,
  ticket_url TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX idx_pix_payments_user_env ON public.pix_payments(user_id, environment);
CREATE INDEX idx_pix_payments_external_ref ON public.pix_payments(mp_external_reference);
CREATE INDEX idx_pix_payments_mp_id ON public.pix_payments(mp_payment_id);

-- RLS
ALTER TABLE public.pix_payments ENABLE ROW LEVEL SECURITY;

-- Usuário pode ver seus próprios pagamentos
CREATE POLICY "Users can view own pix payments"
  ON public.pix_payments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Apenas service_role pode inserir/atualizar (edge functions)
CREATE POLICY "Service role can manage pix payments"
  ON public.pix_payments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Trigger updated_at
CREATE TRIGGER pix_payments_updated_at
  BEFORE UPDATE ON public.pix_payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
