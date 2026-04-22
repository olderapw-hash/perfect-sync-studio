import { useState } from "react";
import { Bookmark, Download, Trash2, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { presetStore, applyPresetToTemplate, type PresetMeta } from "@/lib/presets";
import type { ClsTemplate } from "@/types/clsconfig";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTemplate: ClsTemplate;
  currentRoleid: number;
  currentClassName?: string;
  onApply: (next: ClsTemplate) => void;
}

export const PresetsDialog = ({
  open,
  onOpenChange,
  currentTemplate,
  currentRoleid,
  currentClassName,
  onApply,
}: Props) => {
  const [name, setName] = useState("");
  const [presets, setPresets] = useState<PresetMeta[]>(() => presetStore.list());

  const refresh = () => setPresets(presetStore.list());

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Dê um nome ao preset");
      return;
    }
    presetStore.save(name, currentTemplate, currentRoleid, currentClassName);
    toast.success(`Preset "${name}" salvo`);
    setName("");
    refresh();
  };

  const handleApply = (id: string) => {
    const p = presetStore.get(id);
    if (!p) return;
    const next = applyPresetToTemplate(currentTemplate, p.template);
    onApply(next);
    toast.success(`Preset "${p.name}" aplicado (não esqueça de salvar)`);
    onOpenChange(false);
  };

  const handleRemove = (id: string, name: string) => {
    presetStore.remove(id);
    toast.info(`Preset "${name}" removido`);
    refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" />
            Presets locais
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border border-border bg-card/40 p-3">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Salvar template atual
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={`Ex: ${currentClassName ?? "preset"} build PvP`}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
              <Button onClick={handleSave}>
                <Download className="h-4 w-4" />
                Salvar
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Captura status + inventário + equipamentos + baú do template atual (roleid {currentRoleid}).
              Identidade (nome, cls, base) NÃO é capturada — só os bens.
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Presets salvos ({presets.length})
              </span>
            </div>
            {presets.length === 0 ? (
              <div className="rounded-md border border-dashed border-border/60 bg-background/30 p-6 text-center text-xs text-muted-foreground">
                Nenhum preset ainda. Salve o template atual para reutilizar depois.
              </div>
            ) : (
              <ul className="max-h-[40vh] space-y-1.5 overflow-y-auto">
                {presets.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-border bg-card/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {p.sourceClassName ?? `roleid ${p.sourceRoleid}`} ·{" "}
                        {new Date(p.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="secondary" onClick={() => handleApply(p.id)}>
                        <Upload className="h-3.5 w-3.5" />
                        Aplicar
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemove(p.id, p.name)}
                        title="Remover"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
