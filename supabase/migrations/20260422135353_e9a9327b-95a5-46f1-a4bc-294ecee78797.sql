-- 1. Adiciona 'superadmin' ao enum app_role
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'superadmin';
