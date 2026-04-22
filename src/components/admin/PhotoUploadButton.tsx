// Componente compacto: clica → escolhe arquivo → faz upload e chama onUploaded.
import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Props {
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  className?: string;
  label?: string;
  /** Mostra apenas o ícone (estilo overlay sobre imagem). */
  iconOnly?: boolean;
}

export const PhotoUploadButton = ({
  onUpload,
  onRemove,
  className,
  label = "Trocar foto",
  iconOnly,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo 5MB.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await onUpload(file);
      toast({ title: "Foto enviada" });
    } catch (e) {
      toast({
        title: "Falha no upload",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    setBusy(true);
    try {
      await onRemove();
      toast({ title: "Foto removida" });
    } catch (e) {
      toast({
        title: "Falha ao remover",
        description: e instanceof Error ? e.message : String(e),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className={
            iconOnly
              ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-amber-100 ring-1 ring-amber-400/60 backdrop-blur-sm transition-smooth hover:bg-black/90 hover:text-amber-50 disabled:opacity-50"
              : "inline-flex items-center gap-1.5 rounded-md border border-border bg-card/60 px-2.5 py-1.5 text-xs transition-smooth hover:border-primary/50 disabled:opacity-50"
          }
          title={label}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          {!iconOnly && label}
        </button>
        {onRemove && !iconOnly && (
          <button
            type="button"
            disabled={busy}
            onClick={handleRemove}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card/60 px-2 py-1.5 text-xs text-destructive transition-smooth hover:border-destructive/50 disabled:opacity-50"
            title="Remover"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
