import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePixCheckout } from "@/hooks/usePixCheckout";
import { PixCheckoutModal } from "@/components/PixCheckoutModal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  KeyRound,
  Mail,
  User,
  AlertTriangle,
  CreditCard,
  Crown,
  Trash2,
  ArrowUpRight,
  QrCode,
  Loader2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getPaymentEnvironment } from "@/lib/paddle";

const AccountSettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-extrabold uppercase tracking-wider text-foreground">
            Minha Conta
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie suas credenciais e assinatura
          </p>
        </div>

        <Separator className="border-border/60" />

        {/* Info */}
        <Card className="border-border/60 bg-card/60 backdrop-blur-md">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-bold uppercase tracking-wider">
                Informações da conta
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-4 py-3">
              <span className="text-muted-foreground">Email atual</span>
              <span className="font-mono text-foreground">{user?.email ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-4 py-3">
              <span className="text-muted-foreground">Conta criada em</span>
              <span className="font-mono text-foreground">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString("pt-BR")
                  : "—"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Subscription */}
        <SubscriptionCard />

        {/* Change Email */}
        <ChangeEmailCard currentEmail={user?.email ?? ""} />

        {/* Change Password */}
        <ChangePasswordCard />

        {/* Danger Zone */}
        <DangerZoneCard />
      </div>
    </div>
  );
};

/* ---------- Subscription ---------- */
const PLAN_PRICES: Record<string, { monthly: number; priceId: string; productId: string }> = {
  iniciante: { monthly: 2500, priceId: "pw_admin_iniciante_monthly", productId: "pw_admin_iniciante" },
  pro: { monthly: 15000, priceId: "pw_admin_pro_monthly", productId: "pw_admin_pro" },
  ultimate: { monthly: 30000, priceId: "pw_admin_ultimate_monthly", productId: "pw_admin_ultimate" },
};

const SubscriptionCard = () => {
  const { subscription, isActive, isTrial, plan, loading, refetch } = useSubscription();
  const navigate = useNavigate();
  const { createPixPayment, pixData, loading: pixLoading, status: pixStatus, checking: pixChecking, reset: resetPix } = usePixCheckout();
  const [pixModalOpen, setPixModalOpen] = useState(false);

  const planLabel: Record<string, string> = {
    free: "Gratuito",
    pro: "Pro",
    ultimate: "Ultimate",
    iniciante: "Iniciante",
  };

  const statusLabel: Record<string, string> = {
    active: "Ativo",
    trialing: "Trial",
    past_due: "Pagamento pendente",
    paused: "Pausado",
    canceled: "Cancelado",
  };

  const statusColor: Record<string, string> = {
    active: "bg-success/20 text-success border-success/40",
    trialing: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    past_due: "bg-destructive/20 text-destructive border-destructive/40",
    paused: "bg-muted text-muted-foreground border-border",
    canceled: "bg-destructive/20 text-destructive border-destructive/40",
  };

  const handleRenewPix = async () => {
    const planConfig = PLAN_PRICES[plan] || PLAN_PRICES.pro;
    try {
      await createPixPayment({
        priceId: planConfig.priceId,
        productId: planConfig.productId,
        amountCents: planConfig.monthly,
        environment: getPaymentEnvironment(),
      });
      setPixModalOpen(true);
    } catch {
      // error handled in hook
    }
  };

  const formatBRL = (cents: number) =>
    (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

  return (
    <>
      <Card className="border-border/60 bg-card/60 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider">
              Assinatura
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Gerencie seu plano, upgrade ou cancele sua assinatura.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="py-4 text-center text-xs text-muted-foreground">Carregando…</div>
          ) : !subscription ? (
            <div className="space-y-3">
              <div className="rounded-md border border-border/40 bg-background/40 px-4 py-3 text-sm text-muted-foreground">
                Você não possui uma assinatura ativa.
              </div>
              <Button size="sm" className="w-full" onClick={() => navigate("/pricing")}>
                <Crown className="mr-2 h-3.5 w-3.5" />
                Ver planos e assinar
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Plan & Status */}
              <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">Plano</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{planLabel[plan] ?? plan}</span>
                  {isTrial && (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px]">
                      TRIAL
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-4 py-3">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${statusColor[subscription.status] ?? ""}`}
                >
                  {statusLabel[subscription.status] ?? subscription.status}
                </Badge>
              </div>

              {subscription.current_period_end && (
                <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-4 py-3">
                  <span className="text-sm text-muted-foreground">
                    {subscription.cancel_at_period_end ? "Acesso até" : "Próxima cobrança"}
                  </span>
                  <span className="font-mono text-sm text-foreground">
                    {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              )}

              {subscription.cancel_at_period_end && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-400">
                  Sua assinatura será cancelada ao final do período. Você continuará tendo acesso até a data acima.
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2 pt-1">
                {/* Upgrade */}
                {plan !== "ultimate" && (
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => navigate("/pricing")}
                  >
                    <ArrowUpRight className="mr-2 h-3.5 w-3.5" />
                    {plan === "free" || isTrial ? "Assinar um plano" : "Fazer upgrade"}
                  </Button>
                )}

                {/* Renew via Pix */}
                {isActive && !isTrial && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                    onClick={handleRenewPix}
                    disabled={pixLoading}
                  >
                    {pixLoading ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <QrCode className="mr-2 h-3.5 w-3.5" />
                    )}
                    Renovar via Pix · {formatBRL(PLAN_PRICES[plan]?.monthly || 15000)}
                  </Button>
                )}

                {/* Cancel — only for paid (non-trial) active subs */}
                {isActive && !isTrial && !subscription.cancel_at_period_end && subscription.paddle_subscription_id && (
                  <CancelSubscriptionButton
                    paddleSubscriptionId={subscription.paddle_subscription_id}
                    environment={subscription.environment}
                  />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <PixCheckoutModal
        open={pixModalOpen}
        onClose={() => {
          setPixModalOpen(false);
          resetPix();
          refetch();
        }}
        pixData={pixData}
        status={pixStatus}
        checking={pixChecking}
        planName={`Orphea Core ${planLabel[plan] ?? plan}`}
        amount={`${formatBRL(PLAN_PRICES[plan]?.monthly || 15000)}/mês`}
      />
    </>
  );
};

/* ---------- Cancel Subscription ---------- */
const CancelSubscriptionButton = ({
  paddleSubscriptionId,
  environment,
}: {
  paddleSubscriptionId: string;
  environment: string;
}) => {
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    try {
      // Use the Paddle API via edge function to cancel
      const res = await supabase.functions.invoke("cancel-subscription", {
        body: {
          paddle_subscription_id: paddleSubscriptionId,
          environment,
        },
      });
      if (res.error) throw new Error(res.error.message || "Erro ao cancelar");
      toast.success("Assinatura será cancelada ao final do período atual.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao cancelar assinatura.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
          disabled={loading}
        >
          Cancelar assinatura
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Ao cancelar, você continuará tendo acesso até o final do período já pago.
              Após essa data, seu plano será revertido para o gratuito.
            </p>
            <p className="font-semibold text-foreground">
              Funcionalidades como Server Ops, GM Commander, Segurança e Personagens Reais
              serão desativadas.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Manter assinatura</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Cancelando…" : "Confirmar cancelamento"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

/* ---------- Change Email ---------- */
const ChangeEmailCard = ({ currentEmail }: { currentEmail: string }) => {
  const [newEmail, setNewEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      toast.error("Informe o novo email.");
      return;
    }
    if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
      toast.error("O novo email é igual ao atual.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) throw error;
      toast.success(
        "Um link de confirmação foi enviado para o novo email. Verifique sua caixa de entrada.",
      );
      setNewEmail("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            Alterar email
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Um link de confirmação será enviado para o novo endereço.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-email" className="text-xs text-muted-foreground">
            Novo email
          </Label>
          <Input
            id="new-email"
            type="email"
            placeholder="seunovo@email.com"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="border-border/60 bg-background/60"
          />
        </div>
        <Button
          onClick={handleChangeEmail}
          disabled={loading || !newEmail.trim()}
          size="sm"
          className="w-full"
        >
          {loading ? "Enviando…" : "Solicitar alteração de email"}
        </Button>
      </CardContent>
    </Card>
  );
};

/* ---------- Change Password ---------- */
const ChangePasswordCard = () => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Senha alterada com sucesso!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao alterar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-border/60 bg-card/60 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            Alterar senha
          </CardTitle>
        </div>
        <CardDescription className="text-xs">
          Escolha uma senha forte com no mínimo 6 caracteres.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-password" className="text-xs text-muted-foreground">
            Nova senha
          </Label>
          <Input
            id="new-password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border-border/60 bg-background/60"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password" className="text-xs text-muted-foreground">
            Confirmar nova senha
          </Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="border-border/60 bg-background/60"
          />
        </div>
        <Button
          onClick={handleChangePassword}
          disabled={loading || !newPassword || !confirmPassword}
          size="sm"
          className="w-full"
        >
          {loading ? "Alterando…" : "Alterar senha"}
        </Button>
      </CardContent>
    </Card>
  );
};

/* ---------- Danger Zone ---------- */
const DangerZoneCard = () => {
  const { signOut } = useAuth();
  const [sessionLoading, setSessionLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const handleSignOutAllSessions = async () => {
    setSessionLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      toast.success("Todas as sessões foram encerradas.");
      await signOut();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao encerrar sessões.");
    } finally {
      setSessionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      const { error } = await supabase.functions.invoke("delete-my-account");
      if (error) throw error;
      toast.success("Conta deletada. Você será deslogado em instantes.");
      setTimeout(() => signOut(), 2000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao deletar conta.");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Card className="border-destructive/30 bg-card/60 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-destructive">
            Zona de perigo
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sign out all */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
              disabled={sessionLoading}
            >
              Encerrar todas as sessões
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Encerrar todas as sessões?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso fará logout em todos os dispositivos, incluindo este. Você
                precisará fazer login novamente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSignOutAllSessions}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Encerrar tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Separator className="border-border/40" />

        {/* Delete account */}
        <div className="space-y-3">
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive/90 space-y-2">
            <p className="font-bold">⚠️ Ação irreversível</p>
            <p>
              Ao deletar sua conta, <strong>todos os seus dados serão permanentemente removidos</strong>, incluindo:
            </p>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              <li>Todos os servidores cadastrados e suas configurações</li>
              <li>Templates, backups e histórico de alterações</li>
              <li>Membros e convites de todos os seus servidores</li>
              <li>Assinatura ativa (sem reembolso)</li>
              <li>Licenças e ativações VPS</li>
              <li>Logs de auditoria e dados de eventos</li>
            </ul>
            <p className="font-semibold">
              Você perderá todo o acesso ao painel e não será possível recuperar nenhum dado.
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full border-destructive bg-destructive/10 text-destructive hover:bg-destructive/20"
                disabled={deleteLoading}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Deletar minha conta permanentemente
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">
                  Deletar conta permanentemente?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>
                    Esta ação é <strong>irreversível</strong>. Todos os seus servidores,
                    templates, dados e assinatura serão permanentemente deletados.
                  </p>
                  <p>
                    Para confirmar, digite <strong className="text-foreground">DELETAR</strong> abaixo:
                  </p>
                  <Input
                    placeholder="Digite DELETAR"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="border-destructive/40"
                  />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setConfirmText("")}>
                  Cancelar
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={confirmText !== "DELETAR" || deleteLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteLoading ? "Deletando…" : "Deletar conta para sempre"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountSettingsPage;
