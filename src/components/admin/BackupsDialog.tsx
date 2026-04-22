import { useEffect, useState } from "react";
import { Archive, Loader2, RefreshCw, AlertCircle, FileJson, FileBox, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSeenBackups, type SeenBackup } from "@/lib/seenBackups";
import { pwApi, EndpointMissingError, type BackupRecord } from "@/lib/pwApiActions";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const fmtDate = (ts: number) => new Date(ts).toLocaleString("pt-BR");
const fmtEpochS = (s?: number) =>
  s != null && Number.isFinite(s) ? new Date(s * 1000).toLocaleString("pt-BR") : "—";

export const BackupsDialog = ({ open, onOpenChange }: Props) => {
  const seen = useSeenBackups();
  const [vpsBackups, setVpsBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadVps = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await pwApi.listBackups();
      setVpsBackups(Array.isArray(res?.backups) ? res.backups : []);
      setEndpointMissing(false);
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
        setVpsBackups([]);
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
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="h-4 w-4 text-primary" />
            Backups & Restore
          </DialogTitle>
          <DialogDescription>
            Backups gerados automaticamente a cada save em <code className="font-mono">saveClsconfigTemplate</code>.
            O botão Restaurar está desabilitado até o endpoint{" "}
            <code className="font-mono">restoreBackup</code> existir na VPS.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="session" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="session">
              Esta sessão ({seen.length})
            </TabsTrigger>
            <TabsTrigger value="vps">
              VPS {endpointMissing ? "(indisponível)" : `(${vpsBackups.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="session">
            <p className="mb-2 text-xs text-muted-foreground">
              Coletados a partir das respostas de save desta sessão. Não persiste após fechar a aba.
            </p>
            <SessionList items={seen} onRestoreBlocked={handleRestoreBlocked} />
          </TabsContent>

          <TabsContent value="vps">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Listagem completa do diretório <code className="font-mono">backups/clsconfig/</code>.
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
              <VpsList items={vpsBackups} onRestoreBlocked={handleRestoreBlocked} />
            )}
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

const TypeIcon = ({ type }: { type: SeenBackup["type"] | BackupRecord["type"] }) =>
  type === "role_json" ? (
    <FileJson className="h-3.5 w-3.5 text-primary" />
  ) : (
    <FileBox className="h-3.5 w-3.5 text-secondary-foreground" />
  );

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
}: {
  items: BackupRecord[];
  onRestoreBlocked: () => void;
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
            <th className="px-3 py-2"></th>
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
              <td className="px-3 py-2 font-mono">{b.roleid}</td>
              <td className="px-3 py-2 text-muted-foreground">{fmtEpochS(b.created_at)}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {b.size != null ? `${(b.size / 1024).toFixed(1)} KB` : "—"}
              </td>
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
