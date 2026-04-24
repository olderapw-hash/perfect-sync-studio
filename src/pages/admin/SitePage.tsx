// Página /admin/site — editor do conteúdo público da landing (apenas superadmin).
// Salva tudo num único registro em `site_content` (id=1, JSONB).
import { useEffect, useState } from "react";
import { Loader2, Plus, Save, Sparkles, Trash2, Globe } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  SITE_CONTENT_DEFAULTS,
  useSiteContent,
  type SiteContent,
  type SiteFaqItem,
  type SiteListItem,
  type SiteStep,
} from "@/hooks/useSiteContent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const SitePage = () => {
  const { user } = useAuth();
  const { content: initial, loading, reload } = useSiteContent();
  const [form, setForm] = useState<SiteContent>(SITE_CONTENT_DEFAULTS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) setForm(initial);
  }, [loading, initial]);

  const onSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("site_content").upsert(
      [
        {
          id: 1,
          content: form as unknown as Record<string, unknown>,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        },
      ],
      { onConflict: "id" },
    );
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Página inicial atualizada" });
    await reload();
  };

  const resetDefaults = () => {
    if (!confirm("Restaurar todo o conteúdo da página inicial para o padrão?")) return;
    setForm(SITE_CONTENT_DEFAULTS);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <header className="rounded-xl border border-border bg-card/60 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-extrabold tracking-tight">Conteúdo da Página Inicial</h2>
              <p className="text-xs text-muted-foreground">
                Edite todos os textos da landing pública (/). Aplica-se globalmente para todos os visitantes.
              </p>
            </div>
            <button
              onClick={resetDefaults}
              className="rounded-md border border-border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground transition-smooth hover:border-destructive/50 hover:text-destructive"
            >
              Restaurar padrão
            </button>
          </div>
        </header>

        {/* HERO */}
        <Section icon={<Sparkles className="h-4 w-4 text-primary" />} title="Hero (topo da página)">
          <Field label="Badge" value={form.hero.badge} onChange={(v) => setForm({ ...form, hero: { ...form.hero, badge: v } })} />
          <div>
            <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Título principal
            </Label>
            <Textarea
              value={form.hero.title}
              onChange={(e) => setForm({ ...form, hero: { ...form.hero, title: e.target.value } })}
              rows={2}
              className="text-sm"
              placeholder="Ex.: Administre seu servidor de **Perfect World** sem tocar no banco"
            />
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Use <code className="rounded bg-muted/40 px-1 py-0.5 font-mono">**texto**</code> para
              destacar parte do título em dourado. Ex.: <em>Administre seu servidor de **Perfect World** sem tocar no banco</em>.
            </p>
          </div>
          <FieldArea label="Subtítulo" value={form.hero.subtitle} onChange={(v) => setForm({ ...form, hero: { ...form.hero, subtitle: v } })} />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="CTA primário" value={form.hero.primary_cta} onChange={(v) => setForm({ ...form, hero: { ...form.hero, primary_cta: v } })} />
            <Field label="CTA secundário" value={form.hero.secondary_cta} onChange={(v) => setForm({ ...form, hero: { ...form.hero, secondary_cta: v } })} />
          </div>
          <Field label="Letrinha embaixo dos botões" value={form.hero.fineprint} onChange={(v) => setForm({ ...form, hero: { ...form.hero, fineprint: v } })} />
        </Section>

        {/* PROBLEMAS */}
        <Section title="Problemas">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow" value={form.problems.eyebrow} onChange={(v) => setForm({ ...form, problems: { ...form.problems, eyebrow: v } })} />
            <Field label="Título" value={form.problems.title} onChange={(v) => setForm({ ...form, problems: { ...form.problems, title: v } })} />
          </div>
          <ListItemEditor
            items={form.problems.items}
            onChange={(items) => setForm({ ...form, problems: { ...form.problems, items } })}
            blank={{ title: "", desc: "" }}
          />
        </Section>

        {/* RECURSOS */}
        <Section title="Recursos">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow" value={form.features.eyebrow} onChange={(v) => setForm({ ...form, features: { ...form.features, eyebrow: v } })} />
            <Field label="Título" value={form.features.title} onChange={(v) => setForm({ ...form, features: { ...form.features, title: v } })} />
          </div>
          <FieldArea label="Subtítulo" value={form.features.subtitle} onChange={(v) => setForm({ ...form, features: { ...form.features, subtitle: v } })} />
          <ListItemEditor
            items={form.features.items}
            onChange={(items) => setForm({ ...form, features: { ...form.features, items } })}
            blank={{ title: "", desc: "" }}
          />
        </Section>

        {/* PASSOS */}
        <Section title="Como funciona (passos)">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow" value={form.steps.eyebrow} onChange={(v) => setForm({ ...form, steps: { ...form.steps, eyebrow: v } })} />
            <Field label="Título" value={form.steps.title} onChange={(v) => setForm({ ...form, steps: { ...form.steps, title: v } })} />
          </div>
          <ListItemEditor
            items={form.steps.items as SiteStep[]}
            onChange={(items) => setForm({ ...form, steps: { ...form.steps, items } })}
            blank={{ title: "", desc: "" }}
          />
        </Section>

        {/* PREÇO */}
        <Section title="Preço">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow" value={form.pricing.eyebrow} onChange={(v) => setForm({ ...form, pricing: { ...form.pricing, eyebrow: v } })} />
            <Field label="Título" value={form.pricing.title} onChange={(v) => setForm({ ...form, pricing: { ...form.pricing, title: v } })} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Rótulo do plano" value={form.pricing.plan_label} onChange={(v) => setForm({ ...form, pricing: { ...form.pricing, plan_label: v } })} />
            <Field label="Preço" value={form.pricing.price} onChange={(v) => setForm({ ...form, pricing: { ...form.pricing, price: v } })} />
            <Field label="Sufixo do preço" value={form.pricing.price_suffix} onChange={(v) => setForm({ ...form, pricing: { ...form.pricing, price_suffix: v } })} />
          </div>
          <FieldArea label="Descrição do plano" value={form.pricing.plan_desc} onChange={(v) => setForm({ ...form, pricing: { ...form.pricing, plan_desc: v } })} />
          <StringListEditor
            label="Itens do plano"
            items={form.pricing.features}
            onChange={(items) => setForm({ ...form, pricing: { ...form.pricing, features: items } })}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Texto do botão (CTA)" value={form.pricing.cta} onChange={(v) => setForm({ ...form, pricing: { ...form.pricing, cta: v } })} />
            <Field label="Letrinha abaixo do botão" value={form.pricing.fineprint} onChange={(v) => setForm({ ...form, pricing: { ...form.pricing, fineprint: v } })} />
          </div>
        </Section>

        {/* FAQ */}
        <Section title="FAQ">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Eyebrow" value={form.faq.eyebrow} onChange={(v) => setForm({ ...form, faq: { ...form.faq, eyebrow: v } })} />
            <Field label="Título" value={form.faq.title} onChange={(v) => setForm({ ...form, faq: { ...form.faq, title: v } })} />
          </div>
          <FaqEditor
            items={form.faq.items}
            onChange={(items) => setForm({ ...form, faq: { ...form.faq, items } })}
          />
        </Section>

        {/* CTA FINAL */}
        <Section title="CTA Final">
          <Field label="Título" value={form.final_cta.title} onChange={(v) => setForm({ ...form, final_cta: { ...form.final_cta, title: v } })} />
          <FieldArea label="Subtítulo" value={form.final_cta.subtitle} onChange={(v) => setForm({ ...form, final_cta: { ...form.final_cta, subtitle: v } })} />
          <Field label="Texto do botão" value={form.final_cta.cta} onChange={(v) => setForm({ ...form, final_cta: { ...form.final_cta, cta: v } })} />
        </Section>

        <div className="sticky bottom-4 z-10 flex justify-end gap-2 rounded-xl border border-border bg-card/90 p-3 backdrop-blur-md">
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-glow transition-smooth hover:brightness-110 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar página inicial
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Subcomponentes                                                             */
/* -------------------------------------------------------------------------- */

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="space-y-3 rounded-xl border border-border bg-card/60 p-5">
    <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-foreground">
      {icon}
      {title}
    </h3>
    <div className="space-y-3">{children}</div>
  </section>
);

const Field = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
  </div>
);

const FieldArea = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => (
  <div>
    <Label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {label}
    </Label>
    <Textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="text-sm" />
  </div>
);

interface ListItemEditorProps<T extends { title: string; desc: string }> {
  items: T[];
  onChange: (items: T[]) => void;
  blank: T;
}

function ListItemEditor<T extends { title: string; desc: string }>({
  items,
  onChange,
  blank,
}: ListItemEditorProps<T>) {
  const update = (i: number, patch: Partial<T>) => {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { ...blank }]);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-border bg-background/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Item {i + 1}
            </span>
            <button
              onClick={() => remove(i)}
              className="rounded p-1 text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive"
              title="Remover"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <Field label="Título" value={item.title} onChange={(v) => update(i, { title: v } as Partial<T>)} />
          <div className="mt-2">
            <FieldArea label="Descrição" value={item.desc} onChange={(v) => update(i, { desc: v } as Partial<T>)} />
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background/40 px-3 py-2 text-xs font-semibold text-muted-foreground transition-smooth hover:border-primary/40 hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" /> Adicionar item
      </button>
    </div>
  );
}

const StringListEditor = ({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) => {
  const update = (i: number, v: string) => {
    const next = items.slice();
    next[i] = v;
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, ""]);

  return (
    <div>
      <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </Label>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={it} onChange={(e) => update(i, e.target.value)} className="text-sm" />
            <button
              onClick={() => remove(i)}
              className="rounded p-1.5 text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive"
              title="Remover"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background/40 px-3 py-2 text-xs font-semibold text-muted-foreground transition-smooth hover:border-primary/40 hover:text-primary"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar item
        </button>
      </div>
    </div>
  );
};

const FaqEditor = ({
  items,
  onChange,
}: {
  items: SiteFaqItem[];
  onChange: (items: SiteFaqItem[]) => void;
}) => {
  const update = (i: number, patch: Partial<SiteFaqItem>) => {
    const next = items.slice();
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { q: "", a: "" }]);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border border-border bg-background/40 p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Pergunta {i + 1}
            </span>
            <button
              onClick={() => remove(i)}
              className="rounded p-1 text-muted-foreground transition-smooth hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          <Field label="Pergunta" value={item.q} onChange={(v) => update(i, { q: v })} />
          <div className="mt-2">
            <FieldArea label="Resposta" value={item.a} onChange={(v) => update(i, { a: v })} />
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed border-border bg-background/40 px-3 py-2 text-xs font-semibold text-muted-foreground transition-smooth hover:border-primary/40 hover:text-primary"
      >
        <Plus className="h-3.5 w-3.5" /> Adicionar pergunta
      </button>
    </div>
  );
};

// Workaround para ESLint — `SiteListItem` é usado como tipo só.
void (null as unknown as SiteListItem);

export default SitePage;
