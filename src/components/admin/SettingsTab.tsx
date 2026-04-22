import { useEffect, useState } from "react";
import { Loader2, Save, Server, Shield, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

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
  const [form, setForm] = useState<SettingsForm>(EMPTY);
  const [originalSecret, setOriginalSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    (async () => {
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
    })();
  }, []);

  const onSave = async () => {
    if (!isSuperadmin) {
      toast({ title: "Acesso negado", description: "Apenas superadmin pode salvar.", variant: "destructive" });
      return;
    }
    setSaving(true);
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
            <h2 className="text-lg font-extrabold tracking-tight">Configurações do Servidor</h2>
            <p className="text-xs text-muted-foreground">
              Conexão com a VPS, branding do painel e secret da API.
            </p>
          </div>
        </div>
        {!isSuperadmin && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Você está em modo somente-leitura. Apenas usuários com role <strong>superadmin</strong> podem alterar essas configurações.
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
          Esses valores são usados pelo proxy do servidor pra falar com sua API do Perfect World. Trocou de VPS? É só atualizar aqui.
        </p>
        <div className="space-y-4">
          <Field
            label="URL base da API (PW_API_BASE_URL)"
            hint="Ex: http://93.127.143.77 ou https://meusite.com — sem /apicls/api_cls.php no final."
            value={form.pw_api_base_url}
            onChange={(v) => setForm({ ...form, pw_api_base_url: v })}
            disabled={!isSuperadmin}
            placeholder="http://93.127.143.77"
          />
          <Field
            label="URL base dos ícones (ICON_BASE_URL)"
            hint="Servidor que hospeda os ícones de classe e item. Geralmente o mesmo IP."
            value={form.icon_base_url}
            onChange={(v) => setForm({ ...form, icon_base_url: v })}
            disabled={!isSuperadmin}
            placeholder="http://93.127.143.77/"
          />
          <div>
            <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Secret da API (PW_API_SECRET)
            </Label>
            <div className="relative">
              <Input
                type={showSecret ? "text" : "password"}
                value={form.pw_api_secret}
                onChange={(e) => setForm({ ...form, pw_api_secret: e.target.value })}
                disabled={!isSuperadmin}
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
              Header <code className="font-mono">x-sync-secret</code>. Armazenado no banco com RLS — só superadmin lê/grava.
            </p>
          </div>
        </div>
      </section>

      {/* Branding */}
      <section className="rounded-xl border border-border bg-card/60 p-5">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-foreground">
          <Shield className="h-4 w-4 text-primary" /> Branding do Painel
        </h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Personalização visual — útil pra revender o painel com a identidade do cliente.
        </p>
        <div className="space-y-4">
          <Field
            label="Nome do servidor"
            hint="Aparece no topo do painel e na tela de login."
            value={form.server_name}
            onChange={(v) => setForm({ ...form, server_name: v })}
            disabled={!isSuperadmin}
            placeholder="Perfect World Admin"
          />
          <Field
            label="URL do logo (opcional)"
            hint="Imagem PNG/SVG quadrada, exibida no header."
            value={form.logo_url}
            onChange={(v) => setForm({ ...form, logo_url: v })}
            disabled={!isSuperadmin}
            placeholder="https://..."
          />
          <Field
            label="Cor primária (HSL)"
            hint='Formato: "210 90% 60%" (sem hsl()). Sobrescreve a cor padrão do tema.'
            value={form.primary_color}
            onChange={(v) => setForm({ ...form, primary_color: v })}
            disabled={!isSuperadmin}
            placeholder="210 90% 60%"
          />
        </div>
      </section>

      <div className="flex justify-end gap-2">
        <button
          onClick={onSave}
          disabled={!isSuperadmin || saving}
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
