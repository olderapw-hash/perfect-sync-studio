import { useCallback, useEffect, useState } from "react";
import { Shield, Plus, Pencil, Trash2, RefreshCw, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { OperatorPermissionsProvider, useOperatorPermissions } from "@/hooks/useOperatorPermissions";
import {
  pwApi,
  EndpointMissingError,
  PwApiActionError,
  type OperatorRegistryEntry,
  type OperatorRole,
} from "@/lib/pwApiActions";
import { EndpointMissingNotice } from "@/components/admin/EndpointMissingNotice";

const ROLES: { value: OperatorRole; label: string }[] = [
  { value: "viewer", label: "Viewer" },
  { value: "gm_operator", label: "GM Operator" },
  { value: "gm_supervisor", label: "GM Supervisor" },
  { value: "gm_admin", label: "GM Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const ROLE_COLORS: Record<OperatorRole, string> = {
  viewer: "bg-muted text-muted-foreground",
  gm_operator: "bg-blue-900/40 text-blue-300 border-blue-700/50",
  gm_supervisor: "bg-purple-900/40 text-purple-300 border-purple-700/50",
  gm_admin: "bg-amber-900/40 text-amber-300 border-amber-700/50",
  super_admin: "bg-red-900/40 text-red-300 border-red-700/50",
};

const EMPTY_ENTRY: OperatorRegistryEntry = {
  id: "",
  email: "",
  name: "",
  role: "viewer",
  enabled: true,
  allowed_ips: [],
};

export default function OperatorManagementPage() {
  return (
    <OperatorPermissionsProvider>
      <OperatorManagementContent />
    </OperatorPermissionsProvider>
  );
}

function OperatorManagementContent() {
  const { permissions, role, loading: permLoading } = useOperatorPermissions();
  const [operators, setOperators] = useState<OperatorRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [endpointMissing, setEndpointMissing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OperatorRegistryEntry | null>(null);
  const [form, setForm] = useState<OperatorRegistryEntry>({ ...EMPTY_ENTRY });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OperatorRegistryEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canAccess = role === "super_admin" || permissions?.restore_and_role_edit === true;

  const fetchOperators = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pwApi.getOperatorRegistry();
      setOperators(res.operators ?? []);
      setEndpointMissing(false);
    } catch (e) {
      if (e instanceof EndpointMissingError) {
        setEndpointMissing(true);
      } else {
        toast.error("Erro ao carregar operadores", {
          description: e instanceof Error ? e.message : String(e),
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!permLoading && canAccess) {
      void fetchOperators();
    }
  }, [permLoading, canAccess, fetchOperators]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_ENTRY });
    setDialogOpen(true);
  };

  const openEdit = (op: OperatorRegistryEntry) => {
    setEditing(op);
    setForm({ ...op, allowed_ips: op.allowed_ips ?? [] });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.id.trim() || !form.email.trim()) {
      toast.error("ID e Email são obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const payload: OperatorRegistryEntry = {
        ...form,
        allowed_ips: form.allowed_ips?.filter((ip) => ip.trim()) ?? [],
      };
      await pwApi.saveOperatorRegistryEntry(payload);
      toast.success(editing ? "Operador atualizado" : "Operador criado");
      setDialogOpen(false);
      await fetchOperators();
    } catch (e) {
      const msg =
        e instanceof PwApiActionError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e);
      toast.error("Erro ao salvar operador", { description: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await pwApi.deleteOperatorRegistryEntry({ id: deleteTarget.id });
      toast.success("Operador removido");
      setDeleteTarget(null);
      await fetchOperators();
    } catch (e) {
      const msg =
        e instanceof PwApiActionError
          ? e.message
          : e instanceof Error
            ? e.message
            : String(e);
      toast.error("Erro ao excluir operador", { description: msg });
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleEnabled = async (op: OperatorRegistryEntry) => {
    try {
      await pwApi.saveOperatorRegistryEntry({ ...op, enabled: !op.enabled });
      toast.success(`Operador ${!op.enabled ? "habilitado" : "desabilitado"}`);
      await fetchOperators();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      toast.error("Erro ao alterar status", { description: msg });
    }
  };

  if (permLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-muted-foreground">
        <Shield className="h-12 w-12" />
        <p className="text-lg font-semibold">Acesso restrito</p>
        <p className="text-sm">Apenas operadores super_admin podem acessar esta tela.</p>
      </div>
    );
  }

  if (endpointMissing) {
    return <EndpointMissingNotice action="getOperatorRegistry" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCog className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">Gestão de Operadores</h1>
            <p className="text-sm text-muted-foreground">
              Gerencie os operadores registrados na VPS (operators.json)
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchOperators} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1 h-4 w-4" /> Novo Operador
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="hidden lg:table-cell">ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="hidden xl:table-cell">IPs permitidos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto h-5 w-5 animate-spin" />
                </TableCell>
              </TableRow>
            ) : operators.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Nenhum operador registrado
                </TableCell>
              </TableRow>
            ) : (
              operators.map((op) => (
                <TableRow key={op.id || op.email}>
                  <TableCell className="font-medium">{op.name || "—"}</TableCell>
                  <TableCell className="text-sm">{op.email}</TableCell>
                  <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                    {op.id.slice(0, 8)}…
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={ROLE_COLORS[op.role] ?? ""}>
                      {op.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={op.enabled}
                      onCheckedChange={() => handleToggleEnabled(op)}
                    />
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">
                    {op.allowed_ips?.length ? op.allowed_ips.join(", ") : "Qualquer"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(op)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(op)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Operador" : "Novo Operador"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Atualize os dados do operador. O backend identifica pelo ID ou email."
                : "Preencha os dados para registrar um novo operador na VPS."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="op-id">ID (UUID do usuário)</Label>
              <Input
                id="op-id"
                placeholder="11cfed69-0997-4baa-ae1a-…"
                value={form.id}
                onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="op-email">Email</Label>
              <Input
                id="op-email"
                type="email"
                placeholder="operador@dominio.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="op-name">Nome</Label>
              <Input
                id="op-name"
                placeholder="Nome do operador"
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v as OperatorRole }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="op-enabled"
                checked={form.enabled}
                onCheckedChange={(v) => setForm((f) => ({ ...f, enabled: v }))}
              />
              <Label htmlFor="op-enabled">Habilitado</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="op-ips">IPs permitidos (um por linha, vazio = qualquer)</Label>
              <Textarea
                id="op-ips"
                rows={3}
                placeholder={"192.168.1.100\n10.0.0.1"}
                value={(form.allowed_ips ?? []).join("\n")}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    allowed_ips: e.target.value.split("\n").map((s) => s.trim()),
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando…" : editing ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir operador?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{" "}
              <strong>{deleteTarget?.name || deleteTarget?.email}</strong> do registry?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo…" : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
