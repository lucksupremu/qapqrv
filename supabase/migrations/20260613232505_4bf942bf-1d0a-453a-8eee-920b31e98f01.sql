ALTER TABLE public.push_subscriptions
  ADD COLUMN IF NOT EXISTS wants_install_push BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS install_push_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS platform TEXT;