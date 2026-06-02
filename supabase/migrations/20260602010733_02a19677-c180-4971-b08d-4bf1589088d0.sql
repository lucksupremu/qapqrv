
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('web','android')),
  endpoint text,
  p256dh text,
  auth text,
  fcm_token text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, platform)
);

GRANT INSERT, UPDATE, DELETE, SELECT ON public.push_subscriptions TO anon;
GRANT INSERT, UPDATE, DELETE, SELECT ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert subscription"
  ON public.push_subscriptions FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "anyone can update subscription"
  ON public.push_subscriptions FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "anyone can delete subscription"
  ON public.push_subscriptions FOR DELETE TO anon, authenticated
  USING (true);

CREATE POLICY "no public read subscriptions"
  ON public.push_subscriptions FOR SELECT TO anon, authenticated
  USING (false);

CREATE TABLE IF NOT EXISTS public.scheduled_pushes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  marca_id text,
  title text NOT NULL,
  body text NOT NULL,
  send_at timestamptz NOT NULL,
  sent_at timestamptz,
  attempts int NOT NULL DEFAULT 0,
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_pushes_pending
  ON public.scheduled_pushes (send_at) WHERE sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_scheduled_pushes_device_marca
  ON public.scheduled_pushes (device_id, marca_id);

GRANT INSERT, UPDATE, DELETE, SELECT ON public.scheduled_pushes TO anon;
GRANT INSERT, UPDATE, DELETE, SELECT ON public.scheduled_pushes TO authenticated;
GRANT ALL ON public.scheduled_pushes TO service_role;

ALTER TABLE public.scheduled_pushes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "device can manage own scheduled pushes"
  ON public.scheduled_pushes FOR ALL TO anon, authenticated
  USING (true) WITH CHECK (true);
