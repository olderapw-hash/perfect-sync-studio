// CRUD de templates de correio (mail_templates) — espelha o padrão de
// useInitialKits. Visibility 'server' (todos os membros) ou 'private'
// (só o autor). Toda mutação grava audit_logs via log_audit_event.
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { logAuditEvent } from "@/lib/auditLog";
import {
  isValidMailPayload,
  type MailKind,
  type MailPayload,
  type MailTemplate,
  type MailVisibility,
} from "@/lib/mailTemplates";

interface MailTemplateRow {
  id: string;
  tenant_id: string;
  created_by: string;
  name: string;
  description: string | null;
  kind: MailKind;
  visibility: MailVisibility;
  subject: string | null;
  body: string | null;
  payload: unknown;
  created_at: string;
  updated_at: string;
}

function rowToTemplate(row: MailTemplateRow): MailTemplate | null {
  if (!isValidMailPayload(row.kind, row.payload)) return null;
  return {
    id: row.id,
    tenant_id: row.tenant_id,
    created_by: row.created_by,
    name: row.name,
    description: row.description,
    kind: row.kind,
    visibility: row.visibility,
    subject: row.subject,
    body: row.body,
    payload: row.payload,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export interface CreateMailTemplateInput {
  name: string;
  description?: string | null;
  kind: MailKind;
  visibility: MailVisibility;
  subject?: string | null;
  body?: string | null;
  payload: MailPayload;
}

interface UseMailTemplatesArgs {
  tenantId: string | null;
}

export function useMailTemplates({ tenantId }: UseMailTemplatesArgs) {
  const { session } = useAuth();
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!tenantId || !session?.user) {
      setTemplates([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("mail_templates")
      .select(
        "id, tenant_id, created_by, name, description, kind, visibility, subject, body, payload, created_at, updated_at",
      )
      .eq("tenant_id", tenantId)
      .order("updated_at", { ascending: false });

    if (err) {
      setError(err.message);
      setTemplates([]);
    } else {
      const rows = (data ?? []) as MailTemplateRow[];
      setTemplates(rows.map(rowToTemplate).filter((t): t is MailTemplate => !!t));
    }
    setLoading(false);
  }, [tenantId, session?.user]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  const createTemplate = useCallback(
    async (input: CreateMailTemplateInput): Promise<MailTemplate | null> => {
      if (!tenantId || !session?.user) return null;
      if (!isValidMailPayload(input.kind, input.payload)) {
        setError("Payload inválido para o tipo selecionado.");
        return null;
      }
      const { data, error: err } = await supabase
        .from("mail_templates")
        .insert({
          tenant_id: tenantId,
          created_by: session.user.id,
          name: input.name,
          description: input.description ?? null,
          kind: input.kind,
          visibility: input.visibility,
          subject: input.subject ?? null,
          body: input.body ?? null,
          payload: input.payload as never,
        })
        .select(
          "id, tenant_id, created_by, name, description, kind, visibility, subject, body, payload, created_at, updated_at",
        )
        .single();

      if (err) {
        await logAuditEvent({
          action: "mail_template.create",
          tenantId,
          target: input.name,
          status: "error",
          error: err.message,
        });
        setError(err.message);
        return null;
      }
      const row = data as MailTemplateRow;
      await logAuditEvent({
        action: "mail_template.create",
        tenantId,
        target: row.id,
        metadata: { name: row.name, kind: row.kind, visibility: row.visibility },
      });
      await refetch();
      return rowToTemplate(row);
    },
    [tenantId, session?.user, refetch],
  );

  const updateTemplate = useCallback(
    async (
      id: string,
      patch: Partial<Pick<MailTemplate, "name" | "description" | "visibility" | "subject" | "body" | "payload">> & {
        payload?: MailPayload;
      },
    ): Promise<boolean> => {
      if (!tenantId) return false;
      const updates: {
        name?: string;
        description?: string | null;
        visibility?: MailVisibility;
        subject?: string | null;
        body?: string | null;
        payload?: never;
      } = {};
      if (patch.name !== undefined) updates.name = patch.name;
      if (patch.description !== undefined) updates.description = patch.description;
      if (patch.visibility !== undefined) updates.visibility = patch.visibility;
      if (patch.subject !== undefined) updates.subject = patch.subject;
      if (patch.body !== undefined) updates.body = patch.body;
      if (patch.payload !== undefined) updates.payload = patch.payload as never;

      const { error: err } = await supabase
        .from("mail_templates")
        .update(updates)
        .eq("id", id);

      if (err) {
        await logAuditEvent({
          action: "mail_template.update",
          tenantId,
          target: id,
          status: "error",
          error: err.message,
        });
        return false;
      }
      await logAuditEvent({
        action: "mail_template.update",
        tenantId,
        target: id,
        metadata: patch as Record<string, unknown>,
      });
      await refetch();
      return true;
    },
    [tenantId, refetch],
  );

  const deleteTemplate = useCallback(
    async (id: string): Promise<boolean> => {
      if (!tenantId) return false;
      const { error: err } = await supabase.from("mail_templates").delete().eq("id", id);
      if (err) {
        await logAuditEvent({
          action: "mail_template.delete",
          tenantId,
          target: id,
          status: "error",
          error: err.message,
        });
        return false;
      }
      await logAuditEvent({ action: "mail_template.delete", tenantId, target: id });
      await refetch();
      return true;
    },
    [tenantId, refetch],
  );

  const duplicateTemplate = useCallback(
    async (id: string): Promise<MailTemplate | null> => {
      const orig = templates.find((t) => t.id === id);
      if (!orig) return null;
      return createTemplate({
        name: `${orig.name} (cópia)`,
        description: orig.description,
        kind: orig.kind,
        visibility: orig.visibility,
        subject: orig.subject,
        body: orig.body,
        payload: orig.payload,
      });
    },
    [templates, createTemplate],
  );

  return {
    templates,
    loading,
    error,
    refetch,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
  };
}
