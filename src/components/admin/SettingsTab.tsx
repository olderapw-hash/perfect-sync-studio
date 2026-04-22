import { useEffect, useState } from "react";
import { Loader2, Save, Server, Shield, AlertTriangle, Eye, EyeOff, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTenant, fetchTenantSecret } from "@/hooks/useTenant";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

const NO_EXPORT_TIP = "Seu acesso não permite exportar/baixar o api_cls.php.";

interface SettingsForm {
  server_name: string;
  pw_api_base_url: string;
  icon_base_url: string;
  pw_api_secret: string;
  logo_url: string;
  primary_color: string;
}

const EMPTY: SettingsForm = {
  server_name: "",
  pw_api_base_url: "",
  icon_base_url: "",
  pw_api_secret: "",
  logo_url: "",
  primary_color: "",
};

export const SettingsTab = () => {
  const { isSuperadmin, user } = useAuth();
  const { reload: reloadSettings } = useAppSettings();
  const { tenant, refetch: refetchTenant } = useTenant();
  const { can } = useServerPermissions();
  const canExport = can("manage_servers") || isSuperadmin;
  const [form, setForm] = useState<SettingsForm>(EMPTY);
  const [originalSecret, setOriginalSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Superadmin edits the global app_settings; everyone else edits their own tenant row.
  const editingTenant = !isSuperadmin;
  const canEdit = isSuperadmin || !!user; // any logged-in admin can edit their tenant

  useEffect(() => {
    (async () => {
      if (isSuperadmin) {
        const { data, error } = await supabase
          .from("app_settings")
          .select("*")
          .eq("id", 1)
          .maybeSingle();
        if (error) {
          toast({ title: "Erro ao carregar configurações", description: error.message, variant: "destructive" });
          setLoading(false);
          return;
        }
        if (data) {
          setForm({
            server_name: data.server_name ?? "",
            pw_api_base_url: data.pw_api_base_url ?? "",
            icon_base_url: data.icon_base_url ?? "",
            pw_api_secret: data.pw_api_secret ?? "",
            logo_url: data.logo_url ?? "",
            primary_color: data.primary_color ?? "",
          });
          setOriginalSecret(data.pw_api_secret ?? "");
        }
        setLoading(false);
        return;
      }

      // Tenant mode (admin comum) — carrega do useTenant + busca secret on-demand.
      if (!user) {
        setLoading(false);
        return;
      }
      const secret = await fetchTenantSecret(user.id);
      setForm({
        server_name: tenant?.server_name ?? "",
        pw_api_base_url: tenant?.pw_api_base_url ?? "",
        icon_base_url: tenant?.icon_base_url ?? "",
        pw_api_secret: secret ?? "",
        logo_url: tenant?.logo_url ?? "",
        primary_color: tenant?.primary_color ?? "",
      });
      setOriginalSecret(secret ?? "");
      setLoading(false);
    })();
  }, [isSuperadmin, user?.id, tenant?.id]);

  const onSave = async () => {
    if (!canEdit || !user) {
      toast({ title: "Acesso negado", variant: "destructive" });
      return;
    }
    setSaving(true);

    if (editingTenant) {
      const payload = {
        owner_id: user.id,
        server_name: form.server_name.trim() || "Meu Servidor PW",
        pw_api_base_url: form.pw_api_base_url.trim().replace(/\/+$/, "") || null,
        icon_base_url: form.icon_base_url.trim() ? form.icon_base_url.trim().replace(/\/+$/, "/") : null,
        pw_api_secret: form.pw_api_secret.trim() || null,
        logo_url: form.logo_url.trim() || null,
        primary_color: form.primary_color.trim() || null,
        onboarding_completed: true,
      };
      const { error } = await supabase
        .from("tenants")
        .upsert(payload, { onConflict: "owner_id" });
      setSaving(false);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        return;
      }
      setOriginalSecret(payload.pw_api_secret ?? "");
      toast({ title: "Configurações salvas", description: "Sua conexão com a VPS foi atualizada." });
      await refetchTenant();
      return;
    }

    // Superadmin → app_settings
    const payload = {
      id: 1,
      server_name: form.server_name.trim() || "Perfect World Admin",
      pw_api_base_url: form.pw_api_base_url.trim() || null,
      icon_base_url: form.icon_base_url.trim() || "http://93.127.143.77/",
      pw_api_secret: form.pw_api_secret.trim() || null,
      logo_url: form.logo_url.trim() || null,
      primary_color: form.primary_color.trim() || null,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("app_settings").upsert(payload, { onConflict: "id" });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    setOriginalSecret(payload.pw_api_secret ?? "");
    toast({ title: "Configurações salvas", description: "Recarregando branding..." });
    await reloadSettings();
  };

  const downloadApiCls = async () => {
    if (!canExport) {
      toast({ title: "Acesso negado", description: NO_EXPORT_TIP, variant: "destructive" });
      return;
    }
    if (!form.pw_api_secret.trim()) {
      toast({
        title: "Defina o secret primeiro",
        description: "Gere ou cole um secret e salve antes de baixar o arquivo.",
        variant: "destructive",
      });
      return;
    }
    if (form.pw_api_secret.trim() !== originalSecret) {
      toast({
        title: "Salve as alterações primeiro",
        description: "O download usa o secret salvo no banco. Clique em Salvar antes.",
        variant: "destructive",
      });
      return;
    }
    setDownloading(true);
    try {
      const { data, error } = await supabase.functions.invoke("download-api-cls", {
        method: "GET",
      });
      if (error) throw error;
      // Edge function returns raw PHP text. supabase-js parses it as Blob/text.
      const phpText =
        typeof data === "string" ? data : data instanceof Blob ? await data.text() : String(data);
      const blob = new Blob([phpText], { type: "application/x-httpd-php" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "api_cls.php";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({
        title: "Download iniciado",
        description: "Suba o arquivo pra sua VPS — o secret já vem embutido.",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao gerar arquivo";
      toast({ title: "Erro no download", description: msg, variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="rounded-xl border border-border bg-card/60 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
            <Server className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">
              {editingTenant ? "Configurações do Seu Servidor" : "Configurações Globais"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {editingTenant
                ? "Conexão com a sua VPS, secret da API e branding do painel."
                : "Configurações globais do sistema (superadmin)."}
            </p>
          </div>
        </div>
        {editingTenant && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs text-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>
              Estas configurações afetam <strong>somente o seu painel</strong>. Outros assinantes têm seu próprio tenant.
            </p>
          </div>
        )}
      </header>

      {/* Conexão VPS */}
      <section className="rounded-xl border border-border bg-card/60 p-5">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-foreground">
          <Server className="h-4 w-4 text-primary" /> Conexão com a VPS
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Esses valores são usados pra falar com sua API do Perfect World. Trocou de VPS? É só atualizar aqui.
        </p>
        <div className="space-y-4">
          <Field
            label="URL base da API"
            hint="Ex: http://93.127.143.77/api_cls.php — endpoint completo do api_cls.php."
            value={form.pw_api_base_url}
            onChange={(v) => setForm({ ...form, pw_api_base_url: v })}
            disabled={!canEdit}
            placeholder="http://93.127.143.77/api_cls.php"
          />
          <Field
            label="URL base dos ícones"
            hint="Servidor que hospeda os ícones de classe e item. Geralmente o mesmo IP."
            value={form.icon_base_url}
            onChange={(v) => setForm({ ...form, icon_base_url: v })}
            disabled={!canEdit}
            placeholder="http://93.127.143.77/"
          />
          <div>
            <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Secret da API
            </Label>
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                value={form.pw_api_secret}
                onChange={(e) => setForm({ ...form, pw_api_secret: e.target.value })}
                disabled={!canEdit}
                placeholder={originalSecret ? "•••••••• (definido)" : "Cole o secret aqui"}
                className="pr-10 font-mono text-xs"
              />
              <button
                type="button"
                onClick={() => setShowSecret((s) => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title={showSecret ? "Ocultar" : "Mostrar"}
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Mesmo valor da variável <code className="font-mono">$SECRET</code> dentro do <code className="font-mono">api_cls.php</code> da sua VPS.
            </p>
          </div>

          {editingTenant && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
              <h4 className="mb-1 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-foreground">
                <Download className="h-3.5 w-3.5 text-primary" /> Baixar api_cls.php
              </h4>
              <p className="mb-3 text-[11px] text-muted-foreground">
                Gera o arquivo já com o <strong>seu secret embutido</strong> — é só subir pra sua VPS,
                sem precisar editar nada por dentro.
              </p>
              <button
                type="button"
                onClick={downloadApiCls}
                disabled={downloading || !originalSecret || !canExport}
                title={!canExport ? NO_EXPORT_TIP : undefined}
                className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Baixar api_cls.php personalizado
              </button>
              {!canExport ? (
                <p className="mt-2 text-[11px] text-destructive">{NO_EXPORT_TIP}</p>
              ) : !originalSecret ? (
                <p className="mt-2 text-[11px] text-destructive">
                  Defina e salve o secret antes de baixar.
                </p>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Branding */}
      <section className="rounded-xl border border-border bg-card/60 p-5">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-foreground">
          <Shield className="h-4 w-4 text-primary" /> Branding do Painel
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Personalização visual do seu painel.
        </p>
        <div className="space-y-4">
          <Field
            label="Nome do servidor"
            hint="Aparece no topo do painel."
            value={form.server_name}
            onChange={(v) => setForm({ ...form, server_name: v })}
            disabled={!canEdit}
            placeholder="Meu Servidor PW"
          />
          <Field
            label="URL do logo (opcional)"
            hint="Imagem PNG/SVG quadrada, exibida no header."
            value={form.logo_url}
            onChange={(v) => setForm({ ...form, logo_url: v })}
            disabled={!canEdit}
            placeholder="https://..."
          />
          <Field
            label="Cor primária (HSL)"
            hint='Formato: "210 90% 60%" (sem hsl()). Sobrescreve a cor padrão do tema.'
            value={form.primary_color}
            onChange={(v) => setForm({ ...form, primary_color: v })}
            disabled={!canEdit}
            placeholder="210 90% 60%"
          />
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <button
          onClick={onSave}
          disabled={!canEdit || saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar configurações
        </button>
      </div>
    </div>
  );
};

interface FieldProps {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const Field = ({ label, hint, value, onChange, disabled, placeholder }: FieldProps) => (
  <div>
    <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </Label>
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={placeholder}
      className="text-sm"
    />
    {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);
