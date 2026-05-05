import { useEffect, useRef, useState } from "react";
import { Download, FileIcon, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AdminFile {
  id: string;
  file_name: string;
  description: string | null;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_by: string;
  created_at: string;
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminFilesSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<AdminFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_files")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setFiles(data as unknown as AdminFile[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length || !user) return;
    setUploading(true);

    for (const file of Array.from(fileList)) {
      const storagePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("admin-files")
        .upload(storagePath, file);

      if (uploadErr) {
        toast({ title: `Erro ao enviar ${file.name}`, description: uploadErr.message, variant: "destructive" });
        continue;
      }

      const { error: insertErr } = await supabase.from("admin_files").insert({
        file_name: file.name,
        storage_path: storagePath,
        file_size: file.size,
        mime_type: file.type || null,
        uploaded_by: user.id,
      });

      if (insertErr) {
        toast({ title: `Erro ao registrar ${file.name}`, description: insertErr.message, variant: "destructive" });
      }
    }

    toast({ title: "Upload concluído" });
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    fetchFiles();
  };

  const handleDownload = async (f: AdminFile) => {
    const { data, error } = await supabase.storage
      .from("admin-files")
      .download(f.storage_path);
    if (error || !data) {
      toast({ title: "Erro ao baixar arquivo", description: error?.message, variant: "destructive" });
      return;
    }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (f: AdminFile) => {
    if (!confirm(`Excluir "${f.file_name}"?`)) return;
    await supabase.storage.from("admin-files").remove([f.storage_path]);
    await supabase.from("admin_files").delete().eq("id", f.id);
    toast({ title: "Arquivo removido" });
    fetchFiles();
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
            <FileIcon className="h-4 w-4 text-primary" />
            Arquivos do Admin
          </h3>
          <p className="text-xs text-muted-foreground">
            Envie arquivos para armazenar e baixar quando precisar
          </p>
        </div>
        <div>
          <Input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="mr-1.5 h-3.5 w-3.5" />
            )}
            {uploading ? "Enviando..." : "Enviar arquivo"}
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : files.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-muted-foreground">
          <FileIcon className="mb-2 h-8 w-8 opacity-30" />
          <p className="text-xs font-semibold">Nenhum arquivo salvo</p>
          <p className="text-[10px]">Clique em "Enviar arquivo" para começar.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card/60 divide-y divide-border">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-3 px-4 py-3 text-xs">
              <FileIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{f.file_name}</p>
                <p className="text-muted-foreground text-[10px]">
                  {formatSize(f.file_size)} · {new Date(f.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(f)}>
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDelete(f)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
