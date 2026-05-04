import { useEffect, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  Key,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface License {
  id: string;
  license_key: string;
  client_name: string;
  client_email: string | null;
  plan: string;
  status: "active" | "expired" | "revoked" | "suspended";
  expires_at: string | null;
  activated_at: string | null;
  vps_ip: string | null;
  notes: string | null;
  price_paid: number | null;
  payment_method: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

type LicenseForm = {
  client_name: string;
  client_email: string;
  plan: string;
  status: string;
  expires_at: string;
  vps_ip: string;
  notes: string;
  price_paid: string;
  payment_method: string;
};

const EMPTY_FORM: LicenseForm = {
  client_name: "",
  client_email: "",
  plan: "pro",
  status: "active",
  expires_at: "",
  vps_ip: "",
  notes: "",
  price_paid: "",
  payment_method: "pix",
};

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active: { label: "Ativa", variant: "default" },
  expired: { label: "Expirada", variant: "secondary" },
  revoked: { label: "Revogada", variant: "destructive" },
  suspended: { label: "Suspensa", variant: "outline" },
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("pt-BR") : "—";

export default function LicensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<License | null>(null);
  const [form, setForm] = useState<LicenseForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  const fetchLicenses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("licenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setLicenses(data as unknown as License[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (lic: License) => {
    setEditing(lic);
    setForm({
      client_name: lic.client_name,
      client_email: lic.client_email ?? "",
      plan: lic.plan,
      status: lic.status,
      expires_at: lic.expires_at ? lic.expires_at.slice(0, 10) : "",
      vps_ip: lic.vps_ip ?? "",
      notes: lic.notes ?? "",
      price_paid: lic.price_paid?.toString() ?? "",
      payment_method: lic.payment_method ?? "pix",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.client_name.trim()) {
      toast({ title: "Nome do cliente é obrigatório", variant: "destructive" });
      return;
    }
    setSaving(true);

    const payload = {
      client_name: form.client_name.trim(),
      client_email: form.client_email.trim() || null,
      plan: form.plan,
      status: form.status as License["status"],
      expires_at: form.expires_at ? new Date(form.expires_at + "T23:59:59Z").toISOString() : null,
      vps_ip: form.vps_ip.trim() || null,
      notes: form.notes.trim() || null,
      price_paid: form.price_paid ? parseFloat(form.price_paid) : null,
      payment_method: form.payment_method || null,
    };

    if (editing) {
      const { error } = await supabase
        .from("licenses")
        .update(payload)
        .eq("id", editing.id);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Licença atualizada" });
      }
    } else {
      const { error } = await supabase.from("licenses").insert({ ...payload, created_by: user?.id ?? "" });
      if (error) {
        toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Licença criada com sucesso" });
      }
    }

    setSaving(false);
    setDialogOpen(false);
    fetchLicenses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta licença?")) return;
    await supabase.from("licenses").delete().eq("id", id);
    toast({ title: "Licença removida" });
    fetchLicenses();
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({ title: "Chave copiada!" });
  };

  const setField = (k: keyof LicenseForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-card/60 px-6 py-4 backdrop-blur-md">
        <div>
          <h2 className="text-lg font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Licenças de Instalação
          </h2>
          <p className="text-xs text-muted-foreground">
            Gerencie licenças para venda avulsa do painel
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchLicenses} disabled={loading}>
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nova Licença
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {licenses.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Key className="mb-4 h-12 w-12 opacity-30" />
            <p className="text-sm font-semibold">Nenhuma licença criada</p>
            <p className="text-xs">Clique em "Nova Licença" para começar.</p>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card/60 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="text-xs uppercase tracking-wider">
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chave</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>VPS</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {licenses.map((lic) => {
                  const st = STATUS_MAP[lic.status] ?? STATUS_MAP.active;
                  const keyVisible = visibleKeys.has(lic.id);
                  return (
                    <TableRow key={lic.id} className="text-xs">
                      <TableCell>
                        <div className="font-semibold text-foreground">{lic.client_name}</div>
                        {lic.client_email && (
                          <div className="text-muted-foreground">{lic.client_email}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-[10px]">
                          {lic.plan}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={st.variant} className="text-[10px]">
                          {st.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-mono text-[10px]">
                          <span className="max-w-[120px] truncate">
                            {keyVisible ? lic.license_key : "••••••••••••••••"}
                          </span>
                          <button
                            onClick={() => toggleKeyVisibility(lic.id)}
                            className="p-0.5 text-muted-foreground hover:text-foreground"
                          >
                            {keyVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                          <button
                            onClick={() => copyKey(lic.license_key)}
                            className="p-0.5 text-muted-foreground hover:text-foreground"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>{fmt(lic.expires_at)}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">
                        {lic.vps_ip || "—"}
                      </TableCell>
                      <TableCell>
                        {lic.price_paid != null
                          ? `R$ ${Number(lic.price_paid).toFixed(2)}`
                          : "—"}
                        {lic.payment_method && (
                          <div className="text-muted-foreground capitalize">{lic.payment_method}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(lic)}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(lic.id)}
                            >
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Licença" : "Nova Licença"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Nome do cliente *</Label>
                <Input
                  value={form.client_name}
                  onChange={(e) => setField("client_name", e.target.value)}
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  value={form.client_email}
                  onChange={(e) => setField("client_email", e.target.value)}
                  placeholder="joao@email.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Plano</Label>
                <Select value={form.plan} onValueChange={(v) => setField("plan", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="ultimate">Ultimate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setField("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="suspended">Suspensa</SelectItem>
                    <SelectItem value="revoked">Revogada</SelectItem>
                    <SelectItem value="expired">Expirada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Validade</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setField("expires_at", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Valor pago (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.price_paid}
                  onChange={(e) => setField("price_paid", e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Forma de pagamento</Label>
                <Select value={form.payment_method} onValueChange={(v) => setField("payment_method", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="parcelado">Parcelado</SelectItem>
                    <SelectItem value="transferencia">Transferência</SelectItem>
                    <SelectItem value="boleto">Boleto</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>IP da VPS</Label>
                <Input
                  value={form.vps_ip}
                  onChange={(e) => setField("vps_ip", e.target.value)}
                  placeholder="192.168.1.1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                rows={2}
                placeholder="Notas internas sobre esta licença..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar licença"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
