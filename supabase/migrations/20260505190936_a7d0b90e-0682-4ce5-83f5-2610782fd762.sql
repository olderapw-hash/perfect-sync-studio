
CREATE OR REPLACE FUNCTION public.validate_license(_key text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  _lic RECORD;
  _days_remaining numeric;
BEGIN
  SELECT * INTO _lic FROM public.licenses WHERE license_key = _key;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'not_found');
  END IF;
  
  IF _lic.status = 'revoked' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'revoked');
  END IF;
  
  IF _lic.status = 'suspended' THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'suspended');
  END IF;
  
  IF _lic.expires_at IS NOT NULL AND _lic.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired', 'expired_at', _lic.expires_at);
  END IF;

  -- Check if expires within 3 days
  IF _lic.expires_at IS NOT NULL THEN
    _days_remaining := EXTRACT(EPOCH FROM (_lic.expires_at - now())) / 86400.0;
    IF _days_remaining <= 3 THEN
      RETURN jsonb_build_object(
        'valid', true,
        'plan', _lic.plan,
        'client_name', _lic.client_name,
        'expires_at', _lic.expires_at,
        'activated_at', _lic.activated_at,
        'expires_soon', true,
        'days_remaining', floor(_days_remaining)
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'plan', _lic.plan,
    'client_name', _lic.client_name,
    'expires_at', _lic.expires_at,
    'activated_at', _lic.activated_at,
    'expires_soon', false
  );
END;
$$;
