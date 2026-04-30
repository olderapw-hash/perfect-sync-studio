ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS footer_text text,
  ADD COLUMN IF NOT EXISTS footer_link_label text,
  ADD COLUMN IF NOT EXISTS footer_link_url text;

DROP FUNCTION IF EXISTS public.get_public_branding();

CREATE FUNCTION public.get_public_branding()
RETURNS TABLE(
  server_name text,
  logo_url text,
  primary_color text,
  background_url text,
  favicon_url text,
  footer_text text,
  footer_link_label text,
  footer_link_url text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT server_name, logo_url, primary_color, background_url, favicon_url,
         footer_text, footer_link_label, footer_link_url
  FROM public.app_settings
  WHERE id = 1
  LIMIT 1;
$function$;