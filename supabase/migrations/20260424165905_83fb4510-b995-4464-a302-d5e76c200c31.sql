-- =========================================================
-- 1) Restrict tenants.pw_api_secret to owners only
-- =========================================================
-- Replace the broad "Members can view tenant" policy with one that excludes
-- the secret column for non-owner members. We use column-level GRANT to
-- exclude pw_api_secret from authenticated SELECT, then add a separate
-- owner-only policy that allows reading everything (RPCs already exist for
-- owners to fetch the secret).

-- Revoke column-level SELECT on the secret from authenticated role.
REVOKE SELECT (pw_api_secret) ON public.tenants FROM authenticated;
REVOKE SELECT (pw_api_secret) ON public.tenants FROM anon;

-- Note: owners still read the secret via the existing
-- get_my_tenant_secret() / get_tenant_secret(uuid) SECURITY DEFINER RPCs.
-- Service role keeps full access for edge functions.

-- =========================================================
-- 2) Hide invite emails from non-inviter managers
-- =========================================================
-- Replace the broad manage_members read policy: managers can list pending
-- invites, but only the inviter (or the invitee, via the existing policy)
-- sees the actual email. We enforce this by tightening the policy to the
-- inviter, and exposing a redacted view via RPC for the manage_members UI.

DROP POLICY IF EXISTS "Manage members can read invites" ON public.server_invites;

CREATE POLICY "Inviter can read own pending invites"
  ON public.server_invites
  FOR SELECT
  TO authenticated
  USING (
    invited_by = auth.uid()
    AND status = 'pending'::invite_status
    AND expires_at > now()
  );

-- Provide a redacted listing for the members management UI so other managers
-- can still see how many invites are pending and to which role, but not the
-- raw email address.
CREATE OR REPLACE FUNCTION public.list_server_invites_redacted(_tenant_id uuid)
RETURNS TABLE (
  id uuid,
  tenant_id uuid,
  email_masked text,
  role public.server_role,
  status public.invite_status,
  invited_by uuid,
  invited_at timestamptz,
  expires_at timestamptz,
  is_inviter boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    i.id,
    i.tenant_id,
    CASE
      WHEN i.invited_by = auth.uid() THEN i.email
      ELSE
        regexp_replace(split_part(i.email, '@', 1), '(.).*', '\1***')
        || '@' || split_part(i.email, '@', 2)
    END AS email_masked,
    i.role,
    i.status,
    i.invited_by,
    i.invited_at,
    i.expires_at,
    (i.invited_by = auth.uid()) AS is_inviter
  FROM public.server_invites i
  WHERE i.tenant_id = _tenant_id
    AND i.status = 'pending'::invite_status
    AND i.expires_at > now()
    AND public.has_server_permission(_tenant_id, auth.uid(), 'manage_members')
  ORDER BY i.invited_at DESC;
$$;

-- =========================================================
-- 3) Remove public listing on storage buckets
-- =========================================================
-- Buckets `pw-assets` and `branding` are public so direct URLs keep working,
-- but we drop any policy that allows listing/enumerating their objects.
-- Files can still be fetched by URL since the bucket is public, but
-- attackers can no longer enumerate the bucket contents via the list API.

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND cmd = 'SELECT'
      AND (
        qual ILIKE '%pw-assets%'
        OR qual ILIKE '%branding%'
        OR policyname ILIKE '%pw-assets%'
        OR policyname ILIKE '%branding%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
  END LOOP;
END
$$;
