CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _tenant_id uuid DEFAULT NULL,
  _target text DEFAULT NULL,
  _status text DEFAULT 'ok',
  _http_status integer DEFAULT NULL,
  _error text DEFAULT NULL,
  _metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.audit_logs (
    user_id, tenant_id, action, target, status, http_status, error, metadata
  )
  VALUES (
    auth.uid(),
    _tenant_id,
    _action,
    _target,
    COALESCE(_status, 'ok'),
    _http_status,
    _error,
    _metadata
  )
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;