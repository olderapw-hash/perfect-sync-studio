import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { KeyRound, Mail, User, AlertTriangle } from "lucide-react";
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
            Gerencie suas credenciais de acesso
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
  const [loading, setLoading] = useState(false);

  const handleSignOutAllSessions = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: "global" });
      if (error) throw error;
      toast.success("Todas as sessões foram encerradas.");
      await signOut();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao encerrar sessões.");
    } finally {
      setLoading(false);
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
      <CardContent className="space-y-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
              disabled={loading}
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
      </CardContent>
    </Card>
  );
};

export default AccountSettingsPage;
