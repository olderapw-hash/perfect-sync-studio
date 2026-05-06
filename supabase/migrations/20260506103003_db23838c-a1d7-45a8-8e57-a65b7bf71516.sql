
-- Users can see their own license's VPS activation token
CREATE OR REPLACE FUNCTION public.get_my_vps_activation_token()
RETURNS TABLE(
    activation_token TEXT,
    license_status TEXT,
    vps_status TEXT,
    vps_ip TEXT,
    vps_hostname TEXT,
    activated_at TIMESTAMPTZ,
    last_validated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        l.vps_activation_token,
        l.status::TEXT AS license_status,
        COALESCE(v.status::TEXT, 'pending') AS vps_status,
        v.ip_address,
        v.hostname,
        v.activated_at,
        v.last_validated_at
    FROM public.licenses l
    LEFT JOIN public.vps_activations v ON v.activation_token = l.vps_activation_token
    WHERE l.created_by = auth.uid()
       OR l.client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    ORDER BY l.created_at DESC
    LIMIT 1;
END;
$$;
