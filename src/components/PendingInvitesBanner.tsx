// Banner global mostrando convites pendentes para o e-mail logado.
// Aparece em /admin (e onde mais for embedado). Usa RLS — o usuário
// só vê os próprios convites.
import { useState } from "react";
import { Loader2, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMyPendingInvites } from "@/hooks/useServerMembers";
import { useServers } from "@/hooks/useServers";
import { Button } from "@/components/ui/button";

export const PendingInvitesBanner = () => {
  const { invites, loading, refetch } = useMyPendingInvites();
  const { refetch: refetchServers } = useServers();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (loading || invites.length === 0) return null;

  const accept = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.rpc("accept_server_invite" as never, {
      _invite_id: id,
    } as never);
    setBusyId(null);
    if (error) {
      toast.error("Erro ao aceitar: " + error.message);
      return;
    }
    toast.success("Convite aceito! Você agora é membro do servidor.");
    await Promise.all([refetch(), refetchServers()]);
  };

  const decline = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase
      .from("server_invites")
      .update({ status: "revoked" })
      .eq("id", id);
    setBusyId(null);
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Convite recusado");
    refetch();
  };

  return (
    <div className="border-b border-primary/30 bg-primary/10 px-4 py-2">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 text-xs">
        <Mail className="h-4 w-4 text-primary" />
        <span className="font-bold">
          {invites.length} convite{invites.length > 1 ? "s" : ""} pendente
          {invites.length > 1 ? "s" : ""}
        </span>
        {invites.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center gap-2 rounded-md border border-primary/30 bg-card/60 px-3 py-1"
          >
            <span className="text-muted-foreground">papel:</span>
            <span className="font-mono">{inv.role}</span>
            <Button
              size="sm"
              variant="default"
              onClick={() => accept(inv.id)}
              disabled={busyId === inv.id}
              className="h-6 px-2 text-[11px]"
            >
              {busyId === inv.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Aceitar"
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => decline(inv.id)}
              disabled={busyId === inv.id}
              className="h-6 px-2 text-[11px]"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
