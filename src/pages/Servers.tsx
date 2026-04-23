// Página "Meus Servidores": CRUD de tenants (servidores VPS) por usuário.
// - Lista todos os servidores cadastrados
// - Cadastra novo (nome + URL + secret) com botão "Testar conexão" antes de salvar
// - Marca qual está ativo (o que o painel usa)
// - Edita / remove
// - Mostra status da última conexão
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Plus,
  Power,
  Server,
  Settings,
  ShieldAlert,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useServers, type Server as ServerRow } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { testServerConnection } from "@/lib/serverConnection";
import { friendlyConnectionError } from "@/lib/connectionErrors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const Servers = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const { servers, loading, refetch, setActive } = useServers();
  const { can, loading: permsLoading } = useServerPermissions();
  const [editing, setEditing] = useState<ServerRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !session) navigate("/auth", { replace: true });
  }, [authLoading, session, navigate]);

  const onSaved = () => {
    setEditing(null);
    setCreating(false);
    refetch();
  };

  const onTest = async (s: ServerRow) => {
    setBusyId(s.id);
    const r = await testServerConnection({ tenant_id: s.id });
    setBusyId(null);
    if (r.success) {
      toast.success(
        `Conexão OK${r.entries != null ? ` · ${r.entries} entries` : ""} (${r.elapsed_ms}ms)`,
      );
    } else {
      const f = friendlyConnectionError(r);
      toast.error(f.title, { description: f.hint, duration: 8000 });
    }
    refetch();
  };

  const onActivate = async (s: ServerRow) => {
    if (s.is_active) return;
    setBusyId(s.id);
    try {
      await setActive(s.id);
      toast.success(`"${s.server_name}" agora é o servidor ativo`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao ativar");
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("tenants").delete().eq("id", deleteId);
    if (error) {
      toast.error("Erro ao remover: " + error.message);
    } else {
      toast.success("Servidor removido");
      refetch();
    }
    setDeleteId(null);
  };

  if (authLoading || loading || permsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  // 403 amigável: usuário sem permissão pra administrar servidores.
  // Owner sempre tem manage_servers. Membros sem essa permissão
  // só veem o servidor onde já estão (não podem cadastrar novos / remover).
  if (!can("manage_servers")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="max-w-md rounded-2xl border border-destructive/40 bg-card/60 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
            <ShieldAlert className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="mb-2 text-lg font-extrabold tracking-tight text-foreground">
            Acesso negado
          </h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Seu acesso não permite gerenciar servidores. Peça ao owner pra
            ajustar suas permissões.
          </p>
          <Button onClick={() => navigate("/admin")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao painel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/15">
              <Server className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold uppercase tracking-wider">Meus Servidores</h1>
              <p className="text-xs text-muted-foreground">
                Configure as VPS que você administra
              </p>
            </div>
          </div>
          <Button onClick={() => setCreating(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Adicionar VPS
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {servers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center">
            <Server className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum servidor cadastrado ainda.
            </p>
            <Button className="mt-4" onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar primeiro servidor
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {servers.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "rounded-xl border bg-card/40 p-4 transition-smooth",
                  s.is_active
                    ? "border-primary/60 shadow-glow"
                    : "border-border hover:border-border/80",
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold">{s.server_name}</h3>
                      {s.is_active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          <CheckCircle2 className="h-3 w-3" /> Ativo
                        </span>
                      )}
                      <ConnectionBadge status={s.connection_status} />
                    </div>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {s.pw_api_base_url ?? "(sem URL)"}
                    </p>
                    {s.connection_tested_at && (
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        Último teste: {new Date(s.connection_tested_at).toLocaleString()}
                        {s.connection_error ? ` · ${s.connection_error}` : ""}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTest(s)}
                      disabled={busyId === s.id}
                    >
                      {busyId === s.id ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Wifi className="mr-2 h-3.5 w-3.5" />
                      )}
                      Testar
                    </Button>
                    {!s.is_active && (
                      <Button size="sm" variant="outline" onClick={() => onActivate(s)} disabled={busyId === s.id}>
                        <Power className="mr-2 h-3.5 w-3.5" /> Ativar
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setEditing(s)}>
                      <Settings className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteId(s.id)}
                      disabled={s.is_active && servers.length > 1}
                      title={s.is_active && servers.length > 1 ? "Ative outro servidor antes de remover este" : ""}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ServerFormDialog
        open={creating || editing != null}
        editing={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
        onSaved={onSaved}
        userId={session?.user.id ?? ""}
      />

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover este servidor?</AlertDialogTitle>
            <AlertDialogDescription>
              A configuração local será apagada. A VPS e o api_cls.php continuam funcionando — você
              só não vai mais poder gerenciar daqui até cadastrar de novo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const ConnectionBadge = ({ status }: { status: string | null }) => {
  if (!status) return null;
  if (status === "ok") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-500">
        <Wifi className="h-3 w-3" /> Conectado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
      <WifiOff className="h-3 w-3" /> Erro
    </span>
  );
};

interface FormDialogProps {
  open: boolean;
  editing: ServerRow | null;
  onClose: () => void;
  onSaved: () => void;
  userId: string;
}

const ServerFormDialog = ({ open, editing, onClose, onSaved, userId }: FormDialogProps) => {
  const [serverName, setServerName] = useState("");
  const [apiUrl, setApiUrl] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [iconBase, setIconBase] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (open && editing) {
      setServerName(editing.server_name ?? "");
      setApiUrl(editing.pw_api_base_url ?? "");
      setIconBase(editing.icon_base_url ?? "");
      // Busca o secret específico deste tenant (RPC valida ownership).
      // Funciona mesmo se o servidor NÃO for o ativo.
      supabase
        .rpc("get_tenant_secret", { _tenant_id: editing.id })
        .then(({ data }) => {
          setApiSecret((data as string | null) ?? "");
        });
    } else if (open) {
      setServerName("");
      setApiUrl("");
      setApiSecret("");
      setIconBase("");
    }
    setShowSecret(false);
  }, [open, editing]);

  const generateSecret = () => {
    const arr = new Uint8Array(24);
    crypto.getRandomValues(arr);
    const secret = Array.from(arr)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setApiSecret(secret);
    setShowSecret(true);
    toast.success("Secret gerado");
  };

  const handleTest = async () => {
    if (!apiUrl || !apiSecret) {
      toast.error("Preencha URL e secret antes de testar");
      return;
    }
    setTesting(true);
    const r = await testServerConnection({ url: apiUrl, secret: apiSecret });
    setTesting(false);
    if (r.success) {
      toast.success(`Conexão OK · ${r.elapsed_ms}ms`);
    } else {
      const f = friendlyConnectionError(r);
      toast.error(f.title, { description: f.hint, duration: 8000 });
    }
  };

  const handleSave = async () => {
    if (!apiUrl || !apiSecret) {
      toast.error("URL e secret são obrigatórios");
      return;
    }
    setSaving(true);
    const payload = {
      owner_id: userId,
      server_name: serverName || "Meu Servidor PW",
      pw_api_base_url: apiUrl.replace(/\/+$/, ""),
      pw_api_secret: apiSecret,
      icon_base_url: iconBase ? iconBase.replace(/\/+$/, "/") : null,
      onboarding_completed: true,
    };

    const { error } = editing
      ? await supabase.from("tenants").update(payload).eq("id", editing.id)
      : await supabase.from("tenants").insert(payload);

    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success(editing ? "Servidor atualizado" : "Servidor adicionado");
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar servidor" : "Adicionar VPS"}</DialogTitle>
          <DialogDescription>
            Conecte uma VPS rodando <code className="font-mono">api_cls.php</code>. O secret nunca
            é exposto no navegador — só a edge function fala com a sua VPS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="srv-name">Nome do servidor</Label>
            <Input
              id="srv-name"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="Ex: Perfect World Brasil"
            />
          </div>

          <div>
            <Label htmlFor="srv-url">URL da API</Label>
            <Input
              id="srv-url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://meuserver.com/api_cls.php"
              className="font-mono text-xs"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              URL completa do api_cls.php OU só o domínio base (será appendado /apicls/api_cls.php).
            </p>
          </div>

          <div>
            <Label htmlFor="srv-secret">Secret</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="srv-secret"
                  type={showSecret ? "text" : "password"}
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="pr-10 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Mostrar/ocultar secret"
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={generateSecret}>
                Gerar
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Mesmo valor da variável <code className="font-mono">$SECRET</code> no api_cls.php da
              sua VPS.
            </p>
          </div>

          <div>
            <Label htmlFor="srv-icon">URL base dos ícones (opcional)</Label>
            <Input
              id="srv-icon"
              value={iconBase}
              onChange={(e) => setIconBase(e.target.value)}
              placeholder="https://meuserver.com/"
              className="font-mono text-xs"
            />
          </div>

          <div className="flex items-center gap-2 rounded-md border border-border bg-card/40 p-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing || !apiUrl || !apiSecret}
            >
              {testing ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Wifi className="mr-2 h-3.5 w-3.5" />
              )}
              Testar conexão
            </Button>
            <p className="text-[11px] text-muted-foreground">
              Faz uma chamada real à VPS para validar URL + secret.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving || !apiUrl || !apiSecret}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editing ? "Salvar alterações" : "Adicionar servidor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default Servers;
