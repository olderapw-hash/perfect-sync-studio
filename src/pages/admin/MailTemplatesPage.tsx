// /admin/mail/templates — CRUD de templates de recompensa.
// Lista, cria, edita, duplica, exclui. Mistos: visibility 'server' ou
// 'private'. Permissão de criar/editar = manage_kits (donos sempre podem
// editar/excluir os próprios — RLS já garante).
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Coins,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Package,
  Pencil,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useServers } from "@/hooks/useServers";
import { useServerPermissions } from "@/hooks/useServerPermissions";
import { useMailTemplates } from "@/hooks/useMailTemplates";
import { useItemCatalog } from "@/context/ItemCatalogContext";
import {
  formatGold,
  type MailGoldPayload,
  type MailItemPayload,
  type MailKind,
  type MailTemplate,
  type MailVisibility,
} from "@/lib/mailTemplates";
import { NoActiveServerState } from "@/components/admin/NoActiveServerState";
import { cn } from "@/lib/utils";

type FilterKind = "all" | MailKind;

const MailTemplatesPage = () => {
  const { user } = useAuth();
  const { active } = useServers();
  const { can, loading: permsLoading } = useServerPermissions();
  const tenantId = active?.id ?? null;

  const { templates, loading, error, createTemplate, updateTemplate, deleteTemplate, duplicateTemplate } =
    useMailTemplates({ tenantId });

  const { metaFor } = useItemCatalog();

  const [filter, setFilter] = useState<FilterKind>("all");
  const [search, setSearch] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<MailTemplate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MailTemplate | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (filter !== "all" && t.kind !== filter) return false;
      if (q && !t.name.toLowerCase().includes(q) && !(t.description ?? "").toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [templates, filter, search]);

  const canManage = can("manage_kits");

  if (!tenantId) return <NoActiveServerState />;
  if (permsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (tpl: MailTemplate) => {
    setEditing(tpl);
    setEditorOpen(true);
  };

  const handleDuplicate = async (tpl: MailTemplate) => {
    const created = await duplicateTemplate(tpl.id);
    if (created) toast.success(`Template "${created.name}" duplicado`);
    else toast.error("Falha ao duplicar template");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await deleteTemplate(deleteTarget.id);
    if (ok) {
      toast.success("Template excluído");
      setDeleteTarget(null);
    } else {
      toast.error("Falha ao excluir template");
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-6xl space-y-5 p-6">
        <header className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-extrabold tracking-tight text-foreground">
              Templates de recompensa
            </h1>
            <p className="text-xs text-muted-foreground">
              Modelos reutilizáveis para envio rápido em{" "}
              <Link to="/admin/gm?tab=compensation" className="text-primary hover:underline">
                GM Commander → Compensação
              </Link>
            </p>
          </div>
          {canManage && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo template
            </Button>
          )}
        </header>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterKind)}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="item" className="gap-1.5">
                <Package className="h-3 w-3" />
                Item
              </TabsTrigger>
              <TabsTrigger value="gold" className="gap-1.5">
                <Coins className="h-3 w-3" />
                Moedas
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative ml-auto w-64">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nome ou descrição"
              className="h-8 pl-8 text-xs"
            />
          </div>
          <span className="text-[11px] text-muted-foreground">
            {filtered.length} de {templates.length}
          </span>
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/20 p-10 text-center text-sm text-muted-foreground">
            <Mail className="mx-auto mb-3 h-8 w-8 opacity-50" />
            {templates.length === 0 ? (
              <>
                Nenhum template ainda.{" "}
                {canManage && (
                  <button onClick={openCreate} className="text-primary hover:underline">
                    Criar o primeiro
                  </button>
                )}
              </>
            ) : (
              "Nenhum template corresponde ao filtro."
            )}
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tpl) => (
              <li
                key={tpl.id}
                className="group flex flex-col gap-3 rounded-xl border border-border bg-card/40 p-4 transition-smooth hover:border-primary/50"
              >
                <div className="flex items-start gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      tpl.kind === "item"
                        ? "bg-primary/10 text-primary"
                        : "bg-amber-500/10 text-amber-500",
                    )}
                  >
                    {tpl.kind === "item" ? (
                      <Package className="h-4 w-4" />
                    ) : (
                      <Coins className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-bold text-foreground">{tpl.name}</h3>
                      {tpl.visibility === "private" ? (
                        <span title="Privado" className="text-muted-foreground">
                          <EyeOff className="h-3 w-3" />
                        </span>
                      ) : (
                        <span title="Compartilhado no servidor" className="text-success">
                          <Users className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    {tpl.description && (
                      <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                        {tpl.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <PreviewBlock template={tpl} metaFor={metaFor} />

                <div className="mt-auto flex items-center gap-1 border-t border-border pt-3">
                  <Link
                    to={`/admin/gm?tab=compensation&kind=${tpl.kind}`}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 px-2 py-1 text-[11px] transition-smooth hover:border-primary/50 hover:text-primary"
                    title="Abrir 'GM Commander → Compensação'"
                  >
                    <Send className="h-3 w-3" />
                    Usar
                  </Link>
                  <button
                    onClick={() => handleDuplicate(tpl)}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 px-2 py-1 text-[11px] transition-smooth hover:border-primary/50"
                    title="Duplicar"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                  {(canManage || tpl.created_by === user?.id) && (
                    <>
                      <button
                        onClick={() => openEdit(tpl)}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background/40 px-2 py-1 text-[11px] transition-smooth hover:border-primary/50"
                        title="Editar"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(tpl)}
                        className="ml-auto inline-flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 text-[11px] text-destructive transition-smooth hover:bg-destructive/20"
                        title="Excluir"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Editor */}
      <TemplateEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        editing={editing}
        onCreate={async (input) => {
          const created = await createTemplate(input);
          if (created) {
            toast.success("Template criado");
            setEditorOpen(false);
          } else {
            toast.error("Falha ao criar template");
          }
        }}
        onUpdate={async (id, patch) => {
          const ok = await updateTemplate(id, patch);
          if (ok) {
            toast.success("Template atualizado");
            setEditorOpen(false);
          } else {
            toast.error("Falha ao atualizar");
          }
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Excluir template?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.name && (
                <>
                  O template <strong>"{deleteTarget.name}"</strong> será removido
                  permanentemente. Envios feitos com ele permanecem no histórico,
                  mas perdem a referência ao template.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/* ─────────── Preview de payload ─────────── */

const PreviewBlock = ({
  template,
  metaFor,
}: {
  template: MailTemplate;
  metaFor: (id: number) => { name: string } | undefined;
}) => {
  if (template.kind === "item") {
    const p = template.payload as MailItemPayload;
    const meta = metaFor(p.item_id);
    return (
      <div className="rounded-lg border border-border bg-background/40 p-2.5 text-[11px]">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-foreground">
            {meta?.name ?? p.item_name ?? `Item ${p.item_id}`}
          </span>
          <span className="font-mono text-primary">×{p.count}</span>
        </div>
        <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
          ID {p.item_id}
        </div>
      </div>
    );
  }
  const p = template.payload as MailGoldPayload;
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2.5 text-[11px]">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Valor:</span>
        <span className="font-mono font-semibold text-amber-500">
          {formatGold(p.amount)}
        </span>
      </div>
      <div className="mt-0.5 text-right font-mono text-[10px] text-muted-foreground">
        {p.amount.toLocaleString("pt-BR")} copper
      </div>
    </div>
  );
};

/* ─────────── Dialog de edição ─────────── */

interface EditorProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: MailTemplate | null;
  onCreate: (input: {
    name: string;
    description?: string | null;
    kind: MailKind;
    visibility: MailVisibility;
    subject?: string | null;
    body?: string | null;
    payload: MailItemPayload | MailGoldPayload;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    patch: Partial<{
      name: string;
      description: string | null;
      visibility: MailVisibility;
      subject: string | null;
      body: string | null;
      payload: MailItemPayload | MailGoldPayload;
    }>,
  ) => Promise<void>;
}

const TemplateEditorDialog = ({ open, onOpenChange, editing, onCreate, onUpdate }: EditorProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<MailKind>("item");
  const [visibility, setVisibility] = useState<MailVisibility>("server");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [itemIdStr, setItemIdStr] = useState("");
  const [itemCountStr, setItemCountStr] = useState("1");
  const [goldStr, setGoldStr] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setDescription(editing.description ?? "");
      setKind(editing.kind);
      setVisibility(editing.visibility);
      setSubject(editing.subject ?? "");
      setBody(editing.body ?? "");
      if (editing.kind === "item") {
        const p = editing.payload as MailItemPayload;
        setItemIdStr(String(p.item_id));
        setItemCountStr(String(p.count));
        setGoldStr("");
      } else {
        const p = editing.payload as MailGoldPayload;
        setGoldStr(String(p.amount));
        setItemIdStr("");
        setItemCountStr("1");
      }
    } else {
      setName("");
      setDescription("");
      setKind("item");
      setVisibility("server");
      setSubject("");
      setBody("");
      setItemIdStr("");
      setItemCountStr("1");
      setGoldStr("");
    }
  }, [open, editing]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Nome obrigatório");
      return;
    }
    let payload: MailItemPayload | MailGoldPayload;
    if (kind === "item") {
      const item_id = parseInt(itemIdStr, 10);
      const count = parseInt(itemCountStr, 10);
      if (!Number.isFinite(item_id) || item_id <= 0) {
        toast.error("Item ID inválido");
        return;
      }
      if (!Number.isFinite(count) || count <= 0) {
        toast.error("Quantidade inválida");
        return;
      }
      payload = { item_id, count };
    } else {
      const amount = parseInt(goldStr, 10);
      if (!Number.isFinite(amount) || amount <= 0) {
        toast.error("Valor de moedas inválido");
        return;
      }
      payload = { amount };
    }

    setSaving(true);
    try {
      if (editing) {
        await onUpdate(editing.id, {
          name: name.trim(),
          description: description.trim() || null,
          visibility,
          subject: subject.trim() || null,
          body: body.trim() || null,
          payload,
        });
      } else {
        await onCreate({
          name: name.trim(),
          description: description.trim() || null,
          kind,
          visibility,
          subject: subject.trim() || null,
          body: body.trim() || null,
          payload,
        });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar template" : "Novo template de recompensa"}</DialogTitle>
          <DialogDescription>
            Templates ficam ligados ao servidor ativo. "Privado" só você vê;
            "Compartilhado" fica disponível para todos os membros.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Nome *</Label>
              <Input
                id="tpl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="ex.: Recompensa do evento mensal"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="tpl-vis">Visibilidade</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as MailVisibility)}
              >
                <SelectTrigger id="tpl-vis">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="server">
                    <span className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5" />
                      Compartilhado no servidor
                    </span>
                  </SelectItem>
                  <SelectItem value="private">
                    <span className="flex items-center gap-2">
                      <EyeOff className="h-3.5 w-3.5" />
                      Privado (só você)
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="tpl-desc">Descrição (opcional)</Label>
            <Input
              id="tpl-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
            />
          </div>

          {!editing && (
            <div className="space-y-1.5">
              <Label>Tipo de recompensa</Label>
              <Tabs value={kind} onValueChange={(v) => setKind(v as MailKind)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="item" className="gap-2">
                    <Package className="h-3.5 w-3.5" />
                    Item
                  </TabsTrigger>
                  <TabsTrigger value="gold" className="gap-2">
                    <Coins className="h-3.5 w-3.5" />
                    Moedas
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {kind === "item" ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
              <div className="space-y-1.5">
                <Label htmlFor="tpl-itemid">Item ID *</Label>
                <Input
                  id="tpl-itemid"
                  type="number"
                  min={1}
                  value={itemIdStr}
                  onChange={(e) => setItemIdStr(e.target.value)}
                  className="font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tpl-count">Quantidade *</Label>
                <Input
                  id="tpl-count"
                  type="number"
                  min={1}
                  value={itemCountStr}
                  onChange={(e) => setItemCountStr(e.target.value)}
                  className="font-mono"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="tpl-gold">Valor em copper *</Label>
              <Input
                id="tpl-gold"
                type="number"
                min={1}
                value={goldStr}
                onChange={(e) => setGoldStr(e.target.value)}
                className="font-mono"
                placeholder="1 gold = 10000 copper... espera, 1 gold = 10000 silver = 100 copper"
              />
              {goldStr && Number(goldStr) > 0 && (
                <p className="text-[11px] font-mono text-amber-500">
                  = {formatGold(parseInt(goldStr, 10))}
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="tpl-subj">Assunto padrão</Label>
            <Input
              id="tpl-subj"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={120}
              placeholder="Aparece no correio do jogador"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tpl-body">Corpo padrão</Label>
            <Textarea
              id="tpl-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={1000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MailTemplatesPage;
