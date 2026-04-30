import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Save, Server, Shield, AlertTriangle, ExternalLink, Upload, Image as ImageIcon, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useTenant } from "@/hooks/useTenant";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

interface SettingsForm {
  server_name: string;
  logo_url: string;
  primary_color: string;
  background_url: string;
  favicon_url: string;
  footer_text: string;
  footer_link_label: string;
  footer_link_url: string;
}

const EMPTY: SettingsForm = {
  server_name: "",
  logo_url: "",
  primary_color: "",
  background_url: "",
  favicon_url: "",
  footer_text: "",
  footer_link_label: "",
  footer_link_url: "",
};

/**
 * Configurações do painel.
 *
 * IMPORTANTE: a conexão com a VPS (URL/secret) NÃO é mais editada aqui.
 * Toda chamada à API do PW agora usa o tenant ativo selecionado em /servers
 * (header `x-server-id` injetado por `clsconfigInvoke`). Esta tela só:
 *  - mostra qual é o servidor ativo (readonly) com link para /servers;
 *  - permite editar branding (nome / logo / cor primária).
 */
export const SettingsTab = () => {
  const { isSuperadmin, user } = useAuth();
  const { reload: reloadSettings } = useAppSettings();
  const { tenant, refetch: refetchTenant } = useTenant();
  const [form, setForm] = useState<SettingsForm>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Superadmin edita o app_settings global; demais editam o próprio tenant.
  const editingTenant = !isSuperadmin;
  const canEdit = isSuperadmin || !!user;

  useEffect(() => {
    (async () => {
      if (isSuperadmin) {
        const { data, error } = await supabase
          .from("app_settings")
          .select("server_name, logo_url, primary_color, background_url, favicon_url")
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
            logo_url: data.logo_url ?? "",
            primary_color: data.primary_color ?? "",
            background_url: data.background_url ?? "",
            favicon_url: data.favicon_url ?? "",
          });
        }
        setLoading(false);
        return;
      }

      if (!user) {
        setLoading(false);
        return;
      }
      setForm({
        server_name: tenant?.server_name ?? "",
        logo_url: tenant?.logo_url ?? "",
        primary_color: tenant?.primary_color ?? "",
        background_url: "",
        favicon_url: "",
      });
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
      if (!tenant?.id) {
        toast({
          title: "Nenhum servidor ativo",
          description: "Cadastre/ative um servidor em /servers antes de salvar branding.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
      const { error } = await supabase
        .from("tenants")
        .update({
          server_name: form.server_name.trim() || "Meu Servidor PW",
          logo_url: form.logo_url.trim() || null,
          primary_color: form.primary_color.trim() || null,
        })
        .eq("id", tenant.id);
      setSaving(false);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "Branding salvo" });
      await refetchTenant();
      return;
    }

    // Superadmin → app_settings (branding global + assets)
    const payload = {
      id: 1,
      server_name: form.server_name.trim() || "Orphea Core",
      logo_url: form.logo_url.trim() || null,
      primary_color: form.primary_color.trim() || null,
      background_url: form.background_url.trim() || null,
      favicon_url: form.favicon_url.trim() || null,
      updated_by: user?.id ?? null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase.from("app_settings").upsert(payload, { onConflict: "id" });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
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
            <h2 className="text-lg font-extrabold tracking-tight">
              {editingTenant ? "Configurações do Painel" : "Configurações Globais"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {editingTenant
                ? "Branding do painel. A conexão com a VPS é gerenciada em Servidores."
                : "Branding global do sistema (superadmin)."}
            </p>
          </div>
        </div>
      </header>

      {/* Conexão VPS — LEGADO/READONLY */}
      <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
        <h3 className="mb-1 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-foreground">
          <Server className="h-4 w-4 text-amber-500" /> Conexão com a VPS (legado)
        </h3>
        <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p>
            A conexão agora é gerenciada em <strong>Servidores</strong>. Atualize sua VPS em{" "}
            <code className="font-mono">/servers</code> — os campos abaixo são apenas leitura
            e refletem o servidor atualmente <strong>ativo</strong>.
          </p>
        </div>

        <div className="mt-4 space-y-3">
          <ReadonlyField
            label="Servidor ativo"
            value={tenant?.server_name ?? "(nenhum servidor ativo)"}
          />
          <ReadonlyField
            label="URL base da API"
            value={tenant?.pw_api_base_url ?? "(não configurado)"}
            mono
          />
          <ReadonlyField
            label="URL base dos ícones"
            value={tenant?.icon_base_url ?? "(não configurado)"}
            mono
          />
          <ReadonlyField label="Secret da API" value="•••••••• (oculto — gerenciado em /servers)" mono />
        </div>

        <div className="mt-4">
          <Link
            to="/servers"
            className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary transition-smooth hover:bg-primary/20"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Abrir Servidores
          </Link>
        </div>
      </section>

      {/* Uploads — somente superadmin */}
      {isSuperadmin && (
        <section className="rounded-xl border border-border bg-card/60 p-5">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-foreground">
            <ImageIcon className="h-4 w-4 text-primary" /> Assets do Painel
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Upload de logo, favicon e imagem de fundo. Aplicado globalmente.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <ImageUploader
              label="Logo"
              hint="PNG/SVG quadrado"
              currentUrl={form.logo_url}
              onUploaded={(url) => setForm((f) => ({ ...f, logo_url: url }))}
              onClear={() => setForm((f) => ({ ...f, logo_url: "" }))}
              folder="logos"
            />
            <ImageUploader
              label="Favicon"
              hint="PNG 32x32 ou .ico"
              currentUrl={form.favicon_url}
              onUploaded={(url) => setForm((f) => ({ ...f, favicon_url: url }))}
              onClear={() => setForm((f) => ({ ...f, favicon_url: "" }))}
              folder="favicons"
            />
            <ImageUploader
              label="Background"
              hint="Imagem de fundo do painel"
              currentUrl={form.background_url}
              onUploaded={(url) => setForm((f) => ({ ...f, background_url: url }))}
              onClear={() => setForm((f) => ({ ...f, background_url: "" }))}
              folder="backgrounds"
            />
          </div>
        </section>
      )}

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
            placeholder="Orphea Core"
          />
          <Field
            label="URL do logo (opcional)"
            hint="Cole uma URL ou use o uploader acima."
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
          Salvar branding
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

const ReadonlyField = ({ label, value, mono }: { label: string; value: string; mono?: boolean }) => (
  <div>
    <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </Label>
    <div
      className={`rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm text-muted-foreground ${
        mono ? "font-mono text-xs" : ""
      }`}
    >
      {value}
    </div>
  </div>
);

interface ImageUploaderProps {
  label: string;
  hint?: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
  onClear: () => void;
  folder: string;
}

const ImageUploader = ({ label, hint, currentUrl, onUploaded, onClear, folder }: ImageUploaderProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${folder}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("branding").upload(path, file, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("branding").getPublicUrl(path);
      onUploaded(data.publicUrl);
      toast({ title: `${label} enviado`, description: "Lembre de salvar pra aplicar." });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast({ title: "Falha no upload", description: msg, variant: "destructive" });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
        {currentUrl && (
          <button
            type="button"
            onClick={onClear}
            className="text-muted-foreground transition-smooth hover:text-destructive"
            title="Remover"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md border border-border/60 bg-card/40">
        {currentUrl ? (
          <img src={currentUrl} alt={label} className="h-full w-full object-contain" />
        ) : (
          <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary transition-smooth hover:bg-primary/20 disabled:opacity-50"
      >
        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {uploading ? "Enviando..." : "Enviar arquivo"}
      </button>
      {hint && <p className="mt-1.5 text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
};

