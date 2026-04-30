// /admin/installer — Página exclusiva do superadmin para publicar
// novas versões do pacote do installer (api_cls + script.sh + outros).
//
// Fluxo:
//   1. Superadmin gera um .zip localmente com os arquivos atualizados.
//   2. Faz upload aqui informando versão (ex: 1.4.0) e changelog.
//   3. Marca como "versão atual" — usuários comuns recebem aviso global
//      e badge no botão "Install" do header, com link pra /install.
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  Package,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { InstallerRelease } from "@/hooks/useInstallerRelease";

const formatBytes = (n: number | null) => {
  if (!n) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
};

const InstallerReleasesPage = () => {
  const { user } = useAuth();
  const [releases, setReleases] = useState<InstallerRelease[]>([]);
  const [loading, setLoading] = useState(true);

  // Form de novo release
  const [version, setVersion] = useState("");
  const [changelog, setChangelog] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [makeCurrent, setMakeCurrent] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchReleases = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("installer_releases")
      .select("*")
      .order("published_at", { ascending: false });
    if (error) {
      toast.error("Falha ao carregar releases", { description: error.message });
    } else {
      setReleases((data ?? []) as InstallerRelease[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    void fetchReleases();
  }, []);

  const reset = () => {
    setVersion("");
    setChangelog("");
    setFile(null);
    setMakeCurrent(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!user) return;
    if (!version.trim()) {
      toast.error("Informe a versão (ex: 1.4.0)");
      return;
    }
    if (!file) {
      toast.error("Selecione o arquivo do release");
      return;
    }

    setUploading(true);
    try {
      const cleanVersion = version.trim().replace(/[^a-zA-Z0-9._-]/g, "");
      const ext = file.name.split(".").pop() || "zip";
      const path = `v${cleanVersion}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      // 1. Upload no bucket
      const { error: upErr } = await supabase.storage
        .from("installer-releases")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;

      // 2. URL pública
      const { data: urlData } = supabase.storage
        .from("installer-releases")
        .getPublicUrl(path);

      // 3. Insere no banco
      const { error: insErr } = await supabase.from("installer_releases").insert({
        version: cleanVersion,
        changelog: changelog.trim() || null,
        file_url: urlData.publicUrl,
        file_path: path,
        file_size_bytes: file.size,
        is_current: makeCurrent,
        published_by: user.id,
      });
      if (insErr) {
        // se falhou, tenta limpar o arquivo
        await supabase.storage.from("installer-releases").remove([path]);
        throw insErr;
      }

      toast.success(`Release v${cleanVersion} publicado!`, {
        description: makeCurrent
          ? "Marcado como versão atual — usuários receberão aviso."
          : "Salvo no histórico (não marcado como atual).",
      });
      reset();
      void fetchReleases();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Falha ao publicar release", { description: msg });
    } finally {
      setUploading(false);
    }
  };

  const handleSetCurrent = async (id: string) => {
    const { error } = await supabase
      .from("installer_releases")
      .update({ is_current: true })
      .eq("id", id);
    if (error) {
      toast.error("Falha ao marcar como atual", { description: error.message });
      return;
    }
    toast.success("Versão marcada como atual");
    void fetchReleases();
  };

  const handleDelete = async (rel: InstallerRelease) => {
    if (!confirm(`Remover release v${rel.version}? Essa ação é permanente.`)) return;
    const { error: delDb } = await supabase
      .from("installer_releases")
      .delete()
      .eq("id", rel.id);
    if (delDb) {
      toast.error("Falha ao remover", { description: delDb.message });
      return;
    }
    await supabase.storage.from("installer-releases").remove([rel.file_path]);
    toast.success("Release removido");
    void fetchReleases();
  };

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold">Installer / Releases</h1>
          <p className="text-sm text-muted-foreground">
            Publique novas versões do pacote do installer. Os usuários receberão
            um aviso global e poderão baixar pelo botão{" "}
            <Link to="/install" className="text-primary underline">
              Install
            </Link>{" "}
            do painel.
          </p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Publicar nova versão
            </CardTitle>
            <CardDescription>
              Empacote os arquivos atualizados (ex: api_cls.php, install.sh,
              etc) em um <code>.zip</code> e faça o upload abaixo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="version">Versão *</Label>
                <Input
                  id="version"
                  placeholder="1.4.0"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  disabled={uploading}
                />
                <p className="text-[11px] text-muted-foreground">
                  Use semver (major.minor.patch). Deve ser único.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="file">Arquivo (.zip recomendado) *</Label>
                <Input
                  id="file"
                  ref={fileInputRef}
                  type="file"
                  accept=".zip,.tar,.gz,.tgz,.php,.sh"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  disabled={uploading}
                />
                {file && (
                  <p className="text-[11px] text-muted-foreground">
                    {file.name} · {formatBytes(file.size)}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="changelog">Changelog</Label>
              <Textarea
                id="changelog"
                placeholder="- Corrige erro X&#10;- Adiciona endpoint Y&#10;- Melhora performance Z"
                rows={5}
                value={changelog}
                onChange={(e) => setChangelog(e.target.value)}
                disabled={uploading}
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={makeCurrent}
                onChange={(e) => setMakeCurrent(e.target.checked)}
                disabled={uploading}
                className="h-4 w-4"
              />
              Marcar como versão atual (usuários receberão aviso)
            </label>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={reset} disabled={uploading}>
                Limpar
              </Button>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publicando…
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Publicar release
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Histórico */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              Histórico de releases
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando…
              </div>
            ) : releases.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma versão publicada ainda.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Versão</TableHead>
                    <TableHead>Publicado</TableHead>
                    <TableHead>Tamanho</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {releases.map((rel) => (
                    <TableRow key={rel.id}>
                      <TableCell className="font-mono font-bold">
                        v{rel.version}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(rel.published_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs">
                        {formatBytes(rel.file_size_bytes)}
                      </TableCell>
                      <TableCell>
                        {rel.is_current ? (
                          <Badge className="bg-primary/20 text-primary">
                            <CheckCircle2 className="mr-1 h-3 w-3" /> Atual
                          </Badge>
                        ) : (
                          <Badge variant="outline">Histórico</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <a
                            href={rel.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-accent"
                          >
                            <Download className="h-3 w-3" /> Baixar
                          </a>
                          {!rel.is_current && (
                            <button
                              onClick={() => handleSetCurrent(rel.id)}
                              className="inline-flex items-center gap-1 rounded border border-primary/40 bg-primary/10 px-2 py-1 text-xs text-primary hover:bg-primary/20"
                            >
                              <Check className="h-3 w-3" /> Tornar atual
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(rel)}
                            className="inline-flex items-center gap-1 rounded border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs text-destructive hover:bg-destructive/20"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Pré-visualize a página pública em{" "}
          <Link to="/install" className="inline-flex items-center gap-1 text-primary underline">
            /install <ExternalLink className="h-3 w-3" />
          </Link>
        </p>
      </div>
    </div>
  );
};

export default InstallerReleasesPage;
