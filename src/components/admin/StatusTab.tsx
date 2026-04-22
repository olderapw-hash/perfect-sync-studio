import type { ClsStatus, ClsTemplate } from "@/types/clsconfig";

interface Props {
  template: ClsTemplate;
  onChange: (next: ClsTemplate) => void;
}

const setStatus = (t: ClsTemplate, patch: Partial<ClsStatus>): ClsTemplate => ({
  ...t,
  status: { ...t.status, ...patch },
});

export const StatusTab = ({ template, onChange }: Props) => {
  const s = template.status;
  return (
    <div className="space-y-6">
      <Section title="Atributos principais">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <NumField label="Level" value={s.level} onChange={(v) => onChange(setStatus(template, { level: v }))} />
          <NumField label="Cultivo (level2)" value={s.level2} onChange={(v) => onChange(setStatus(template, { level2: v }))} />
          <NumField label="Fama (reputation)" value={s.reputation} onChange={(v) => onChange(setStatus(template, { reputation: v }))} />
          <NumField label="HP" value={s.hp} onChange={(v) => onChange(setStatus(template, { hp: v }))} />
          <NumField label="MP" value={s.mp} onChange={(v) => onChange(setStatus(template, { mp: v }))} />
          <NumField label="EXP" value={s.exp} onChange={(v) => onChange(setStatus(template, { exp: v }))} />
          <NumField label="SP" value={s.sp} onChange={(v) => onChange(setStatus(template, { sp: v }))} />
          <NumField label="PP" value={s.pp} onChange={(v) => onChange(setStatus(template, { pp: v }))} />
          <NumField label="Cultivation" value={s.cultivation} onChange={(v) => onChange(setStatus(template, { cultivation: v }))} />
        </div>
      </Section>

      <Section title="Posição e mundo">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onChange(
                setStatus(template, {
                  posx: 1250.386 as unknown as number,
                  posy: 219.618 as unknown as number,
                  posz: 1145.902 as unknown as number,
                }),
              )
            }
            className="inline-flex items-center gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition-smooth hover:bg-primary/20"
            title="Define posx/posy/posz para a cidade inicial (1250.386, 219.618, 1145.902)"
          >
            🏙️ Teleportar para Cidade Inicial
          </button>
          <span className="font-mono text-[11px] text-muted-foreground">
            1250.386, 219.618, 1145.902
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <NumField label="World tag" value={s.worldtag} onChange={(v) => onChange(setStatus(template, { worldtag: v }))} />
          <NumField label="Pos X" value={s.posx} step="any" onChange={(v) => onChange(setStatus(template, { posx: v }))} />
          <NumField label="Pos Y" value={s.posy} step="any" onChange={(v) => onChange(setStatus(template, { posy: v }))} />
          <NumField label="Pos Z" value={s.posz} step="any" onChange={(v) => onChange(setStatus(template, { posz: v }))} />
          <NumField label="Storesize" value={s.storesize} onChange={(v) => onChange(setStatus(template, { storesize: v }))} />
          <NumField label="Charactermode" value={s.charactermode} onChange={(v) => onChange(setStatus(template, { charactermode: v }))} />
        </div>
      </Section>

      <Section title="Double EXP">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <NumField label="Expire" value={s.dbltime_expire} onChange={(v) => onChange(setStatus(template, { dbltime_expire: v }))} />
          <NumField label="Mode" value={s.dbltime_mode} onChange={(v) => onChange(setStatus(template, { dbltime_mode: v }))} />
          <NumField label="Begin" value={s.dbltime_begin} onChange={(v) => onChange(setStatus(template, { dbltime_begin: v }))} />
          <NumField label="Used" value={s.dbltime_used} onChange={(v) => onChange(setStatus(template, { dbltime_used: v }))} />
          <NumField label="Max" value={s.dbltime_max} onChange={(v) => onChange(setStatus(template, { dbltime_max: v }))} />
          <NumField label="Time used" value={s.time_used} onChange={(v) => onChange(setStatus(template, { time_used: v }))} />
        </div>
      </Section>

      <Section title="Blobs (raw, opcional)">
        <p className="mb-2 text-xs text-muted-foreground">
          Campos avançados. Edite com cuidado — strings serializadas do servidor.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <TextArea label="property" value={s.property} onChange={(v) => onChange(setStatus(template, { property: v }))} />
          <TextArea label="var_data" value={s.var_data} onChange={(v) => onChange(setStatus(template, { var_data: v }))} />
          <TextArea label="skills" value={s.skills} onChange={(v) => onChange(setStatus(template, { skills: v }))} />
          <TextArea label="title_data" value={s.title_data} onChange={(v) => onChange(setStatus(template, { title_data: v }))} />
        </div>
      </Section>
    </div>
  );
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h4 className="uppercase-label mb-3">{title}</h4>
    {children}
  </section>
);

const NumField = ({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) => (
  <label className="block">
    <span className="uppercase-label mb-1.5 block">{label}</span>
    <input
      type="number"
      step={step}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => {
        const raw = e.target.value;
        const n = step === "any" ? parseFloat(raw) : parseInt(raw, 10);
        onChange(Number.isFinite(n) ? n : 0);
      }}
      className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-sm outline-none transition-smooth focus:border-primary"
    />
  </label>
);

const TextArea = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <label className="block">
    <span className="uppercase-label mb-1.5 block">{label}</span>
    <textarea
      rows={3}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-border bg-background/60 px-3 py-2 font-mono text-xs outline-none transition-smooth focus:border-primary"
    />
  </label>
);
