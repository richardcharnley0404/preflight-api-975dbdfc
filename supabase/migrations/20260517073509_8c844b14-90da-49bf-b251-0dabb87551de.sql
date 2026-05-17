ALTER TABLE public.jobs ADD COLUMN results jsonb;
ALTER TABLE public.jobs ADD COLUMN webhook_delivered boolean;