import { Fingerprint, Gamepad2, Coins, Shield } from "lucide-react";
import { USE_MOCK, API_BASE_URL } from "@/lib/api";

interface SyncHeaderProps {
  totalClasses: number;
  totalItems: number;
}

export const SyncHeader = ({ totalClasses, totalItems }: SyncHeaderProps) => (
  <header className="mx-auto max-w-6xl px-4 pt-8 md:pt-10">
    {/* Tabs nav (visual reference to PHP profile) */}
    <nav className="mb-8 flex flex-wrap gap-2 border-b border-white/5 pb-2">
      <button className="flex items-center gap-2 rounded-lg bg-primary/10 px-5 py-3 text-sm font-extrabold uppercase tracking-wider text-primary shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]">
        <Shield className="h-4 w-4" />
        Sync · clsconfig 16
      </button>
      <div className="ml-auto inline-flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2 text-[11px] text-muted-foreground">
        <span className={`h-1.5 w-1.5 rounded-full ${USE_MOCK ? "bg-warning animate-pulse-glow" : "bg-success"}`} />
        {USE_MOCK ? "Modo demo (mock local)" : `API: ${API_BASE_URL}`}
      </div>
    </nav>

    {/* Title */}
    <div className="mb-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">
        Painel de Personagens Iniciais
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Edite HP, MP e itens iniciais por classe e sincronize com o servidor.
      </p>
    </div>

    {/* Overview cards (PHP style) */}
    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <OverviewCard
        icon={<Fingerprint className="h-5 w-5" />}
        iconBg="bg-[rgba(102,126,234,0.1)] text-[#667eea]"
        label="Configuração"
        value="clsconfig · 16"
      />
      <OverviewCard
        icon={<Gamepad2 className="h-5 w-5" />}
        iconBg="bg-success/10 text-success"
        label="Classes carregadas"
        value={String(totalClasses)}
      />
      <OverviewCard
        icon={<Coins className="h-5 w-5" />}
        iconBg="bg-warning/10 text-warning"
        label="Itens iniciais"
        value={String(totalItems)}
      />
    </div>
  </header>
);

interface OverviewCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}

const OverviewCard = ({ icon, iconBg, label, value }: OverviewCardProps) => (
  <div className="glass-card glass-card-hover flex items-center gap-4 rounded-2xl p-5 transition-smooth">
    <div className={`flex h-[54px] w-[54px] items-center justify-center rounded-xl ${iconBg}`}>
      {icon}
    </div>
    <div className="min-w-0">
      <div className="uppercase-label">{label}</div>
      <div className="mt-0.5 truncate text-xl font-extrabold text-foreground">{value}</div>
    </div>
  </div>
);
