import { useEffect, useState } from "react";
import { Archive, Loader2, RefreshCw, AlertCircle, FileJson, FileBox, FileText, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSeenBackups, type SeenBackup } from "@/lib/seenBackups";
import { pwApi, EndpointMissingError, type BackupRecord, type BackupKind } from "@/lib/pwApiActions";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const fmtDate = (ts: number) => new Date(ts).toLocaleString("pt-BR");
const fmtEpochS = (s?: number) =>
  s != null && Number.isFinite(s) ? new Date(s * 1000).toLocaleString("pt-BR") : "—";

interface VpsBuckets {
  all: BackupRecord[];
  role_json: BackupRecord[];
  clsconfig_files: BackupRecord[];
  export_logs: BackupRecord[];
}

const emptyBuckets: VpsBuckets = { all: [], role_json: [], clsconfig_files: [], export_logs: [] };

export const BackupsDialog = ({ open, onOpenChange }: Props) => {
  const seen = useSeenBackups();
  const [vps, setVps] = useState<VpsBuckets>(emptyBuckets);
  const [loading, setLoading] = useState(false);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVps = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pwApi.listBackups({ limit: 50 });
      const b = res?.backups ?? {};
      // Garante o tipo em cada record (caso PHP omita).
      const tag = (arr: BackupRecord[] | undefined, kind: BackupKind): BackupRecord[] =>
        Array.isArray(arr) ? arr.map((r) => ({ ...r, type: r.type ?? kind })) : [];
      const role_json = tag(b.role_json, "role_json");
      const clsconfig_files = tag(b.clsconfig_files, "clsconfig_file");
      const export_logs = tag(b.export_logs, "export_log");
      const all = Array.isArray(b.all) && b.all.length > 0
        ? b.all.map((r) => ({ ...r }))
        : [...role_json, ...clsconfig_files, ...export_logs].sort(
            (x, y) => (y.created_at ?? 0) - (x.created_at ?? 0),
          );
      setVps({ all, role_json, clsconfig_files, export_logs });
      setEndpointMissing(false);
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
        setVps(emptyBuckets);
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      void loadVps();
    }
  }, [open]);

  const handleRestoreBlocked = () => {
    toast.warning("Endpoint restoreBackup ainda não implementado", {
      description:
        "Implemente ?action=restoreBackup no apicls/api_cls.php (ver docs/api-contract.md). Antes de qualquer restore real, gerar backup do estado atual.",
      duration: 7000,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-primary" />
            Backups & Restore
          </DialogTitle>
          <DialogDescription>
            Backups gerados automaticamente a cada save. O botão Restaurar está desabilitado até o
            endpoint <code className="font-mono">restoreBackup</code> ser confirmado.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="vps" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vps">
              VPS {endpointMissing ? "(indisponível)" : `(${vps.all.length})`}
            </TabsTrigger>
            <TabsTrigger value="session">
              Esta sessão ({seen.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vps">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Listagem real do diretório <code className="font-mono">backups/clsconfig/</code> via{" "}
                <code className="font-mono">action=listBackups</code>.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={loadVps}
                disabled={loading || endpointMissing}
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                Recarregar
              </Button>
            </div>

            {endpointMissing ? (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
                <div className="flex items-center gap-2 font-semibold text-warning">
                  <AlertCircle className="h-4 w-4" />
                  Endpoint listBackups ainda não implementado
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Use a aba "Esta sessão" enquanto isso. O contrato esperado está em{" "}
                  <code className="font-mono">docs/api-contract.md</code>.
                </p>
              </div>
            ) : error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            ) : (
              <Tabs defaultValue="all">
                <TabsList className="mb-2">
                  <TabsTrigger value="all">Todos ({vps.all.length})</TabsTrigger>
                  <TabsTrigger value="role_json">role_json ({vps.role_json.length})</TabsTrigger>
                  <TabsTrigger value="clsconfig_files">clsconfig ({vps.clsconfig_files.length})</TabsTrigger>
                  <TabsTrigger value="export_logs">exports ({vps.export_logs.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="all">
                  <VpsList items={vps.all} onRestoreBlocked={handleRestoreBlocked} />
                </TabsContent>
                <TabsContent value="role_json">
                  <VpsList items={vps.role_json} onRestoreBlocked={handleRestoreBlocked} />
                </TabsContent>
                <TabsContent value="clsconfig_files">
                  <VpsList items={vps.clsconfig_files} onRestoreBlocked={handleRestoreBlocked} />
                </TabsContent>
                <TabsContent value="export_logs">
                  <VpsList items={vps.export_logs} onRestoreBlocked={handleRestoreBlocked} hideRestore />
                </TabsContent>
              </Tabs>
            )}
          </TabsContent>

          <TabsContent value="session">
            <p className="mb-2 text-xs text-muted-foreground">
              Coletados a partir das respostas de save desta sessão. Não persiste após fechar a aba.
            </p>
            <SessionList items={seen} onRestoreBlocked={handleRestoreBlocked} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const RestoreButton = ({ onClick }: { onClick: () => void }) => (
  <Button
    size="sm"
    variant="outline"
    disabled
    onClick={onClick}
    title="Endpoint restoreBackup ainda não implementado"
    className="cursor-not-allowed"
  >
    <Lock className="h-3 w-3" />
    Restaurar
  </Button>
);

const TypeIcon = ({ type }: { type: SeenBackup["type"] | BackupKind }) => {
  if (type === "role_json") return <FileJson className="h-3.5 w-3.5 text-primary" />;
  if (type === "export_log") return <FileText className="h-3.5 w-3.5 text-muted-foreground" />;
  return <FileBox className="h-3.5 w-3.5 text-secondary-foreground" />;
};

const SessionList = ({
  items,
  onRestoreBlocked,
}: {
  items: SeenBackup[];
  onRestoreBlocked: () => void;
}) => {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        Nenhum backup gerado nesta sessão. Faça um save para começar.
      </p>
    );
  }
  return (
    <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/60 backdrop-blur">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Roleid</th>
            <th className="px-3 py-2 font-medium">Quando</th>
            <th className="px-3 py-2 font-medium">Arquivo</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((b) => (
            <tr key={b.id} className="hover:bg-muted/30">
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1.5">
                  <TypeIcon type={b.type} />
                  {b.type}
                </span>
              </td>
              <td className="px-3 py-2 font-mono">{b.roleid}</td>
              <td className="px-3 py-2 text-muted-foreground">{fmtDate(b.ts)}</td>
              <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground" title={b.file}>
                …{b.file.slice(-50)}
              </td>
              <td className="px-3 py-2 text-right">
                <RestoreButton onClick={onRestoreBlocked} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const VpsList = ({
  items,
  onRestoreBlocked,
  hideRestore,
}: {
  items: BackupRecord[];
  onRestoreBlocked: () => void;
  /** Para export_logs não faz sentido restaurar. */
  hideRestore?: boolean;
}) => {
  if (items.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
        Nenhum backup retornado pela VPS.
      </p>
    );
  }
  return (
    <div className="max-h-[50vh] overflow-y-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-muted/60 backdrop-blur">
          <tr className="text-left">
            <th className="px-3 py-2 font-medium">Tipo</th>
            <th className="px-3 py-2 font-medium">Roleid</th>
            <th className="px-3 py-2 font-medium">Criado</th>
            <th className="px-3 py-2 font-medium">Tam.</th>
            <th className="px-3 py-2 font-medium">Arquivo</th>
            {!hideRestore && <th className="px-3 py-2"></th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((b, i) => (
            <tr key={`${b.file}-${i}`} className="hover:bg-muted/30">
              <td className="px-3 py-2">
                <span className="inline-flex items-center gap-1.5">
                  <TypeIcon type={b.type} />
                  {b.type}
                </span>
              </td>
              <td className="px-3 py-2 font-mono">{b.roleid ?? "—"}</td>
              <td className="px-3 py-2 text-muted-foreground">{fmtEpochS(b.created_at)}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {b.size != null ? `${(b.size / 1024).toFixed(1)} KB` : "—"}
              </td>
              <td className="px-3 py-2 font-mono text-[10px] text-muted-foreground" title={b.file}>
                …{b.file.slice(-50)}
              </td>
              {!hideRestore && (
                <td className="px-3 py-2 text-right">
                  <RestoreButton onClick={onRestoreBlocked} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
