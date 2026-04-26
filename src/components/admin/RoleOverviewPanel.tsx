// Painel GM read-only premium para visualização de personagem real.
//
// Lê dados já carregados em memória (ClsTemplate vindo de getRoleEditable)
// e expõe abas de leitura focadas em diagnóstico:
//   - Visão Geral · Inventário · Equipamentos · Banco · Status · Tasks · Progressão
//
// Esta camada é READ-ONLY por design. A edição continua acontecendo no
// ClsconfigEditor (logo abaixo na página), preservando todo o fluxo atual
// de save/auto-export/backups/auditoria.
import { useMemo, useState } from "react";
import {
  Backpack,
  Coins,
  Compass,
  Crown,
  Eye,
  Gauge,
  Layers,
  ListTree,
  MapPin,
  Package,
  ScrollText,
  Shield,
  Sparkles,
  Sword,
  TrendingUp,
  Trophy,
  User,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getClassInfo,
  getGenderInfo,
  getInitials,
  getRaceName,
} from "@/lib/pwClasses";
import { useCharacterPhoto } from "@/hooks/useCharacterPhoto";
import { useAppSettings } from "@/hooks/useAppSettings";
import { ItemSlot } from "./ItemSlot";
import type { ClsItem, ClsTemplate } from "@/types/clsconfig";

interface Props {
  template: ClsTemplate;
  /** Roleid real autoritativo. Sobrepõe o que está no template em qualquer divergência. */
  roleid: number;
  online?: boolean | null;
}

type TabKey =
  | "overview"
  | "inventory"
  | "equipment"
  | "storehouse"
  | "status"
  | "tasks"
  | "progression";

interface TabMeta {
  key: TabKey;
  label: string;
  icon: typeof Eye;
}

const TABS: TabMeta[] = [
  { key: "overview", label: "Visão Geral", icon: Eye },
  { key: "inventory", label: "Inventário", icon: Backpack },
  { key: "equipment", label: "Equipamentos", icon: Sword },
  { key: "storehouse", label: "Banco", icon: Warehouse },
  { key: "status", label: "Status", icon: Gauge },
  { key: "tasks", label: "Tasks", icon: ScrollText },
  { key: "progression", label: "Progressão", icon: TrendingUp },
];

const fmt = (n: number | null | undefined): string => {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR");
};

const countFilled = (items: ClsItem[] | undefined): number =>
  (items ?? []).filter((it) => it && it.id > 0).length;

export const RoleOverviewPanel = ({ template, roleid, online }: Props) => {
  const [tab, setTab] = useState<TabKey>("overview");

  const cls = template.base?.cls ?? 0;
  const race = template.base?.race ?? 0;
  const gender = template.base?.gender ?? 0;
  const classInfo = getClassInfo(race, cls);
  const raceName = getRaceName(race);
  const genderInfo = getGenderInfo(gender);
  const className = template.summary?.class_name || classInfo.name;
  const charName = template.summary?.name || template.base?.name || "(sem nome)";

  const { settings } = useAppSettings();
  const fallbackPhotoUrl = useMemo(() => {
    const path = template.summary?.class_icon_path;
    if (!path) return null;
    const base = settings.icon_base_url || "";
    if (/^https?:\/\//i.test(path)) return path;
    return `${base.replace(/\/$/, "")}/${path.replace(/^\/+/, "")}`;
  }, [template.summary?.class_icon_path, settings.icon_base_url]);

  const photo = useCharacterPhoto({
    roleid,
    cls,
    fallbackUrl: fallbackPhotoUrl,
  });

  const ActiveIcon = TABS.find((t) => t.key === tab)?.icon ?? Eye;
  const activeLabel = TABS.find((t) => t.key === tab)?.label ?? "";

  return (
    <section
      className="overflow-hidden rounded-2xl border border-bronze-soft/60"
      style={{
        background:
          "linear-gradient(180deg, hsl(30 25% 9% / 0.85), hsl(20 28% 5% / 0.9))",
        boxShadow:
          "0 0 0 1px hsl(0 0% 0% / 0.4), 0 12px 36px hsl(0 0% 0% / 0.45)",
      }}
    >
      {/* HERO — identidade do personagem */}
      <header className="relative flex flex-col gap-4 border-b border-bronze-soft/40 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            background: `radial-gradient(circle at 15% 20%, hsl(${classInfo.color} / 0.35), transparent 55%)`,
          }}
        />

        {/* Avatar */}
        <div
          className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2"
          style={{
            borderColor: `hsl(${classInfo.color} / 0.7)`,
            boxShadow: `0 0 18px hsl(${classInfo.color} / 0.35), inset 0 0 0 1px hsl(0 0% 0% / 0.6)`,
            background:
              "linear-gradient(145deg, hsl(0 0% 8%), hsl(0 0% 14%))",
          }}
        >
          {photo.url ? (
            <img
              src={photo.url}
              alt={charName}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center font-serif text-2xl font-bold"
              style={{ color: `hsl(${classInfo.color})` }}
            >
              {getInitials(charName)}
            </div>
          )}
          {photo.loading && (
            <div className="absolute inset-0 animate-pulse bg-black/30" />
          )}
        </div>

        {/* Nome + meta */}
        <div className="relative min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2
              className="truncate font-serif text-2xl font-bold tracking-wide"
              style={{
                color: "hsl(45 90% 75%)",
                textShadow: "0 2px 8px hsl(0 0% 0% / 0.8)",
              }}
              title={charName}
            >
              {charName}
            </h2>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
              style={{
                background: `hsl(${classInfo.color} / 0.18)`,
                color: `hsl(${classInfo.color})`,
                boxShadow: `inset 0 0 0 1px hsl(${classInfo.color} / 0.4)`,
              }}
            >
              <Shield className="h-3 w-3" />
              {className}
            </span>
            {online != null && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                  online
                    ? "bg-destructive/15 text-destructive shadow-[inset_0_0_0_1px_hsl(0_70%_50%/0.4)]"
                    : "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_0_1px_hsl(150_50%_45%/0.4)]",
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    online ? "bg-destructive animate-pulse" : "bg-emerald-400",
                  )}
                />
                {online ? "Online" : "Offline"}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-bronze-muted">
            <Meta label="roleid" value={fmt(roleid)} mono />
            <Meta label="userid" value={fmt(template.base?.userid)} mono />
            <Meta label="raça" value={raceName} />
            <Meta label="gênero" value={`${genderInfo.symbol} ${genderInfo.label}`} />
            <Meta label="cônjuge" value={template.base?.spouse ? fmt(template.base.spouse) : "—"} mono />
          </div>
        </div>

        {/* Stats principais (chips de destaque) */}
        <div className="relative grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          <StatChip
            icon={<Crown className="h-3.5 w-3.5" />}
            label="Level"
            value={fmt(template.status?.level)}
            tone="gold"
          />
          <StatChip
            icon={<Sparkles className="h-3.5 w-3.5" />}
            label="Cultivo"
            value={fmt(template.status?.cultivation)}
            tone="violet"
          />
          <StatChip
            icon={<Trophy className="h-3.5 w-3.5" />}
            label="Fama"
            value={fmt(template.status?.reputation)}
            tone="amber"
          />
        </div>
      </header>

      {/* TABS */}
      <nav className="border-b border-bronze-soft/40 bg-black/20 px-2 py-2">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 [scrollbar-width:thin] xl:grid xl:grid-cols-7 xl:overflow-visible">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "group flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold tracking-wide transition xl:shrink",
                  active
                    ? "border-primary/60 bg-primary/15 text-primary shadow-[0_0_14px_hsl(38_70%_50%/0.3)]"
                    : "border-bronze-soft/40 bg-black/30 text-bronze-muted hover:border-bronze-soft hover:text-bronze",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="whitespace-nowrap">{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* CONTENT */}
      <div className="px-4 py-5 sm:px-6">
        <header className="mb-4 flex items-center gap-2">
          <ActiveIcon className="h-4 w-4 text-bronze" />
          <h3
            className="font-serif text-base font-bold tracking-wide text-bronze"
            style={{ textShadow: "0 1px 4px hsl(0 0% 0% / 0.7)" }}
          >
            {activeLabel}
          </h3>
          <span className="ml-auto text-[10px] font-bold uppercase tracking-[0.18em] text-bronze-muted">
            Visualização · somente leitura
          </span>
        </header>

        {tab === "overview" && (
          <OverviewPane template={template} className={className} />
        )}
        {tab === "inventory" && <InventoryPane template={template} />}
        {tab === "equipment" && <EquipmentPane template={template} />}
        {tab === "storehouse" && <StorehousePane template={template} />}
        {tab === "status" && <StatusPane template={template} />}
        {tab === "tasks" && <TasksPane template={template} />}
        {tab === "progression" && <ProgressionPane template={template} />}
      </div>
    </section>
  );
};

// ────────────────────────── Sub-componentes ──────────────────────────

const Meta = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) => (
  <span className="inline-flex items-baseline gap-1.5">
    <span className="text-[10px] font-bold uppercase tracking-wider text-bronze-muted/70">
      {label}
    </span>
    <span className={cn("text-bronze", mono && "font-mono")}>{value}</span>
  </span>
);

const StatChip = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "gold" | "violet" | "amber" | "blue" | "emerald" | "rose";
}) => {
  const palette: Record<typeof tone, { bg: string; ring: string; text: string }> = {
    gold: { bg: "45 80% 55% / 0.15", ring: "45 80% 55% / 0.45", text: "45 90% 70%" },
    violet: { bg: "270 70% 65% / 0.15", ring: "270 70% 65% / 0.45", text: "270 90% 80%" },
    amber: { bg: "32 90% 55% / 0.15", ring: "32 90% 55% / 0.45", text: "35 95% 70%" },
    blue: { bg: "210 80% 60% / 0.15", ring: "210 80% 60% / 0.45", text: "210 90% 75%" },
    emerald: { bg: "150 60% 45% / 0.15", ring: "150 60% 45% / 0.45", text: "150 70% 65%" },
    rose: { bg: "350 70% 55% / 0.15", ring: "350 70% 55% / 0.45", text: "350 90% 75%" },
  };
  const p = palette[tone];
  return (
    <div
      className="flex min-w-[110px] flex-col rounded-lg px-3 py-2"
      style={{
        background: `hsl(${p.bg})`,
        boxShadow: `inset 0 0 0 1px hsl(${p.ring})`,
      }}
    >
      <span
        className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.18em]"
        style={{ color: `hsl(${p.text} / 0.85)` }}
      >
        {icon}
        {label}
      </span>
      <span
        className="mt-0.5 font-mono text-lg font-bold leading-tight"
        style={{ color: `hsl(${p.text})` }}
      >
        {value}
      </span>
    </div>
  );
};

const Card = ({
  title,
  icon,
  children,
  className,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "rounded-xl border border-bronze-soft/40 bg-black/30 p-4",
      className,
    )}
  >
    <header className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-bronze-muted">
      {icon}
      {title}
    </header>
    {children}
  </div>
);

const KV = ({
  label,
  value,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) => (
  <div className="flex items-baseline justify-between gap-3 border-b border-bronze-soft/15 py-1.5 last:border-b-0">
    <span className="text-[11px] uppercase tracking-wider text-bronze-muted">
      {label}
    </span>
    <span
      className={cn(
        "truncate text-right text-sm text-bronze",
        mono && "font-mono",
      )}
    >
      {value ?? "—"}
    </span>
  </div>
);

const Empty = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-dashed border-bronze-soft/40 bg-black/20 px-4 py-6 text-center text-xs text-bronze-muted">
    {message}
  </div>
);

// ────────────────────────── Painéis por aba ──────────────────────────

const OverviewPane = ({
  template,
  className,
}: {
  template: ClsTemplate;
  className: string;
}) => {
  const inv = template.inventory;
  const eq = template.equipment;
  const st = template.storehouse;
  const status = template.status;
  const base = template.base;

  const totalStorehouseItems =
    countFilled(st?.items) +
    countFilled(st?.dress) +
    countFilled(st?.material) +
    countFilled(st?.generalcard);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Identidade" icon={<User className="h-3.5 w-3.5" />}>
        <KV label="Classe" value={className} />
        <KV label="Level" value={`${fmt(status?.level)} / ${fmt(status?.level2 ?? 0)}`} mono />
        <KV label="Cultivo" value={fmt(status?.cultivation)} mono />
        <KV label="Reputação (Fama)" value={fmt(status?.reputation)} mono />
        <KV label="World tag" value={fmt(status?.worldtag)} mono />
        <KV
          label="Criado em"
          value={
            base?.create_time
              ? new Date(base.create_time * 1000).toLocaleString("pt-BR")
              : "—"
          }
        />
        <KV
          label="Último login"
          value={
            base?.lastlogin_time
              ? new Date(base.lastlogin_time * 1000).toLocaleString("pt-BR")
              : "—"
          }
        />
      </Card>

      <Card title="Localização" icon={<MapPin className="h-3.5 w-3.5" />}>
        <KV
          label="Posição (X, Y, Z)"
          value={`${fmt(status?.posx)}, ${fmt(status?.posy)}, ${fmt(status?.posz)}`}
          mono
        />
        <KV label="World tag" value={fmt(status?.worldtag)} mono />
        <KV label="Charactermode" value={fmt(status?.charactermode)} mono />
        <KV
          label="Waypoints"
          value={
            status?.waypointlist
              ? `${(status.waypointlist.length / 2) | 0} bytes`
              : "—"
          }
          mono
        />
      </Card>

      <Card title="Moedas & Recursos" icon={<Coins className="h-3.5 w-3.5" />}>
        <KV label="Ouro (mochila)" value={fmt(inv?.money)} mono />
        <KV label="Ouro (banco)" value={fmt(st?.money)} mono />
        <KV
          label="Total de ouro"
          value={fmt((inv?.money ?? 0) + (st?.money ?? 0))}
          mono
        />
        <KV label="Exp" value={fmt(status?.exp)} mono />
        <KV label="SP" value={fmt(status?.sp)} mono />
        <KV label="PP" value={fmt(status?.pp)} mono />
      </Card>

      <Card title="Resumo de itens" icon={<Layers className="h-3.5 w-3.5" />}>
        <KV
          label="Inventário"
          value={`${countFilled(inv?.items)} / ${fmt(inv?.capacity)}`}
          mono
        />
        <KV label="Equipamentos" value={`${countFilled(eq?.items)} ativos`} mono />
        <KV
          label="Banco · capacidade"
          value={fmt(st?.capacity)}
          mono
        />
        <KV
          label="Banco · itens"
          value={`${totalStorehouseItems} (geral: ${countFilled(st?.items)} · vestes: ${countFilled(st?.dress)} · mat: ${countFilled(st?.material)} · cards: ${countFilled(st?.generalcard)})`}
        />
      </Card>
    </div>
  );
};

const ItemsGrid = ({ items, columns = 8 }: { items: ClsItem[]; columns?: number }) => {
  const filled = items.filter((i) => i && i.id > 0);
  if (filled.length === 0) return <Empty message="Nenhum item ocupado nesta seção." />;
  return (
    <div
      className="grid gap-[3px] rounded-md p-2"
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        background: "linear-gradient(180deg, hsl(20 25% 5%), hsl(25 30% 9%))",
        boxShadow:
          "inset 0 0 0 1px hsl(40 50% 30% / 0.6), inset 0 2px 8px hsl(0 0% 0% / 0.7)",
      }}
    >
      {filled
        .slice()
        .sort((a, b) => a.pos - b.pos)
        .map((it) => (
          <ItemSlot key={`${it.pos}-${it.id}`} item={it} size={42} />
        ))}
    </div>
  );
};

const InventoryPane = ({ template }: { template: ClsTemplate }) => {
  const inv = template.inventory;
  const filled = countFilled(inv?.items);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon={<Package className="h-3.5 w-3.5" />} label="Slots usados" value={`${filled}`} tone="amber" />
        <StatChip icon={<Layers className="h-3.5 w-3.5" />} label="Capacidade" value={fmt(inv?.capacity)} tone="blue" />
        <StatChip icon={<Coins className="h-3.5 w-3.5" />} label="Ouro" value={fmt(inv?.money)} tone="gold" />
        <StatChip icon={<Compass className="h-3.5 w-3.5" />} label="Timestamp" value={fmt(inv?.timestamp)} tone="violet" />
      </div>
      <Card title="Itens da mochila" icon={<Backpack className="h-3.5 w-3.5" />}>
        <ItemsGrid items={inv?.items ?? []} />
      </Card>
    </div>
  );
};

const EquipmentPane = ({ template }: { template: ClsTemplate }) => {
  const eq = template.equipment;
  const filled = countFilled(eq?.items);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatChip icon={<Sword className="h-3.5 w-3.5" />} label="Slots ativos" value={`${filled}`} tone="rose" />
        <StatChip icon={<Shield className="h-3.5 w-3.5" />} label="Total" value={`${eq?.items?.length ?? 0}`} tone="blue" />
        <StatChip icon={<Crown className="h-3.5 w-3.5" />} label="Level char" value={fmt(template.status?.level)} tone="gold" />
      </div>
      <Card title="Itens equipados" icon={<Sword className="h-3.5 w-3.5" />}>
        <ItemsGrid items={eq?.items ?? []} columns={6} />
      </Card>
    </div>
  );
};

const StorehousePane = ({ template }: { template: ClsTemplate }) => {
  const st = template.storehouse;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon={<Coins className="h-3.5 w-3.5" />} label="Ouro" value={fmt(st?.money)} tone="gold" />
        <StatChip icon={<Layers className="h-3.5 w-3.5" />} label="Capacidade" value={fmt(st?.capacity)} tone="blue" />
        <StatChip icon={<Package className="h-3.5 w-3.5" />} label="Geral" value={`${countFilled(st?.items)}`} tone="amber" />
        <StatChip icon={<Sparkles className="h-3.5 w-3.5" />} label="Vestes/Mat/Cards" value={`${countFilled(st?.dress) + countFilled(st?.material) + countFilled(st?.generalcard)}`} tone="violet" />
      </div>

      <Card title="Itens (geral)" icon={<Warehouse className="h-3.5 w-3.5" />}>
        <ItemsGrid items={st?.items ?? []} />
      </Card>
      <Card title="Vestes" icon={<Sparkles className="h-3.5 w-3.5" />}>
        <ItemsGrid items={st?.dress ?? []} />
      </Card>
      <Card title="Materiais" icon={<Package className="h-3.5 w-3.5" />}>
        <ItemsGrid items={st?.material ?? []} />
      </Card>
      <Card title="Cards / Genéricos" icon={<Layers className="h-3.5 w-3.5" />}>
        <ItemsGrid items={st?.generalcard ?? []} />
      </Card>
    </div>
  );
};

const StatusPane = ({ template }: { template: ClsTemplate }) => {
  const s = template.status;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Vitalidade" icon={<Gauge className="h-3.5 w-3.5" />}>
        <KV label="HP" value={fmt(s?.hp)} mono />
        <KV label="MP" value={fmt(s?.mp)} mono />
        <KV label="Level" value={fmt(s?.level)} mono />
        <KV label="Level 2" value={fmt(s?.level2)} mono />
        <KV label="Cultivo" value={fmt(s?.cultivation)} mono />
      </Card>
      <Card title="Pontos & XP" icon={<TrendingUp className="h-3.5 w-3.5" />}>
        <KV label="Exp" value={fmt(s?.exp)} mono />
        <KV label="SP" value={fmt(s?.sp)} mono />
        <KV label="PP" value={fmt(s?.pp)} mono />
        <KV label="Reputação" value={fmt(s?.reputation)} mono />
      </Card>
      <Card title="Buffs / Tempo" icon={<Sparkles className="h-3.5 w-3.5" />}>
        <KV label="Dbltime · modo" value={fmt(s?.dbltime_mode)} mono />
        <KV label="Dbltime · usado" value={fmt(s?.dbltime_used)} mono />
        <KV label="Dbltime · máx" value={fmt(s?.dbltime_max)} mono />
        <KV
          label="Dbltime · expira"
          value={
            s?.dbltime_expire
              ? new Date(s.dbltime_expire * 1000).toLocaleString("pt-BR")
              : "—"
          }
        />
        <KV label="Tempo jogado" value={fmt(s?.time_used)} mono />
      </Card>
      <Card title="Blobs binários (tamanho)" icon={<ListTree className="h-3.5 w-3.5" />}>
        <KV label="property" value={`${(s?.property?.length ?? 0) / 2 | 0} bytes`} mono />
        <KV label="skills" value={`${(s?.skills?.length ?? 0) / 2 | 0} bytes`} mono />
        <KV label="title_data" value={`${(s?.title_data?.length ?? 0) / 2 | 0} bytes`} mono />
        <KV label="meridian_data" value={`${(s?.meridian_data?.length ?? 0) / 2 | 0} bytes`} mono />
        <KV label="reincarnation_data" value={`${(s?.reincarnation_data?.length ?? 0) / 2 | 0} bytes`} mono />
        <KV label="realm_data" value={`${(s?.realm_data?.length ?? 0) / 2 | 0} bytes`} mono />
      </Card>
    </div>
  );
};

const TasksPane = ({ template }: { template: ClsTemplate }) => {
  const task = template.task;
  if (!task) {
    return (
      <Empty message="A VPS não retornou bloco `task` para este personagem (campo opcional do gamedbd)." />
    );
  }
  const data = task.task_data ?? "";
  const complete = task.task_complete ?? "";
  const finishtime = task.task_finishtime ?? "";
  const inv = task.task_inventory ?? [];
  const filled = countFilled(inv);
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatChip icon={<ScrollText className="h-3.5 w-3.5" />} label="Task data" value={`${(data.length / 2) | 0} B`} tone="violet" />
        <StatChip icon={<ScrollText className="h-3.5 w-3.5" />} label="Concluídas" value={`${(complete.length / 2) | 0} B`} tone="emerald" />
        <StatChip icon={<ScrollText className="h-3.5 w-3.5" />} label="Finishtime" value={`${(finishtime.length / 2) | 0} B`} tone="amber" />
        <StatChip icon={<Backpack className="h-3.5 w-3.5" />} label="Inv. de quest" value={`${filled}/${inv.length}`} tone="blue" />
      </div>
      <Card title="Itens vinculados a quests" icon={<Backpack className="h-3.5 w-3.5" />}>
        <ItemsGrid items={inv} />
      </Card>
      <Card title="Blobs (somente inspeção)" icon={<ListTree className="h-3.5 w-3.5" />}>
        <KV label="task_data" value={data ? `${(data.length / 2) | 0} bytes` : "(vazio)"} mono />
        <KV label="task_complete" value={complete ? `${(complete.length / 2) | 0} bytes` : "(vazio)"} mono />
        <KV label="task_finishtime" value={finishtime ? `${(finishtime.length / 2) | 0} bytes` : "(vazio)"} mono />
      </Card>
    </div>
  );
};

const ProgressionPane = ({ template }: { template: ClsTemplate }) => {
  const s = template.status;
  // Heurística simples para barra de progresso (sem fórmula oficial de XP).
  const expBar = (() => {
    const exp = s?.exp ?? 0;
    if (exp <= 0) return 0;
    // Exibe a posição relativa em uma escala log10 capada em 100.
    const v = Math.min(100, Math.max(0, Math.log10(exp + 1) * 12));
    return Math.round(v);
  })();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card title="Nível" icon={<Crown className="h-3.5 w-3.5" />}>
        <KV label="Level principal" value={fmt(s?.level)} mono />
        <KV label="Level 2 (cultivo avançado)" value={fmt(s?.level2)} mono />
        <KV label="Cultivo" value={fmt(s?.cultivation)} mono />
        <div className="mt-3">
          <div className="mb-1 flex items-baseline justify-between text-[11px]">
            <span className="text-bronze-muted uppercase tracking-wider">Exp acumulada</span>
            <span className="font-mono text-bronze">{fmt(s?.exp)}</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full"
            style={{ background: "hsl(0 0% 0% / 0.6)", boxShadow: "inset 0 0 0 1px hsl(40 50% 30% / 0.4)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${expBar}%`,
                background:
                  "linear-gradient(90deg, hsl(45 90% 55%), hsl(35 80% 45%))",
                boxShadow: "0 0 12px hsl(45 90% 55% / 0.5)",
              }}
            />
          </div>
          <div className="mt-1 text-right text-[10px] text-bronze-muted">
            barra ilustrativa (escala log)
          </div>
        </div>
      </Card>

      <Card title="Reputação & Honra" icon={<Trophy className="h-3.5 w-3.5" />}>
        <KV label="Reputação (Fama)" value={fmt(s?.reputation)} mono />
        <KV label="SP" value={fmt(s?.sp)} mono />
        <KV label="PP" value={fmt(s?.pp)} mono />
        <KV label="Worldtag" value={fmt(s?.worldtag)} mono />
      </Card>

      <Card title="Tempo de jogo" icon={<TrendingUp className="h-3.5 w-3.5" />}>
        <KV label="Tempo usado (s)" value={fmt(s?.time_used)} mono />
        <KV
          label="Última conexão"
          value={
            template.base?.lastlogin_time
              ? new Date(template.base.lastlogin_time * 1000).toLocaleString("pt-BR")
              : "—"
          }
        />
        <KV
          label="Criado em"
          value={
            template.base?.create_time
              ? new Date(template.base.create_time * 1000).toLocaleString("pt-BR")
              : "—"
          }
        />
      </Card>

      <Card title="Conta / vínculos" icon={<User className="h-3.5 w-3.5" />}>
        <KV label="userid" value={fmt(template.base?.userid)} mono />
        <KV label="cônjuge" value={template.base?.spouse ? fmt(template.base.spouse) : "—"} mono />
        <KV label="status (base)" value={fmt(template.base?.status)} mono />
        <KV label="custom_stamp" value={fmt(template.base?.custom_stamp)} mono />
      </Card>
    </div>
  );
};
