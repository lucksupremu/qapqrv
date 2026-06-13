
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  locale text,
  tz text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  last_notified_at timestamptz,
  inactivity_stage smallint NOT NULL DEFAULT 0,
  unsubscribed_at timestamptz
);

CREATE INDEX idx_push_subs_active_lastseen
  ON public.push_subscriptions (last_seen_at)
  WHERE unsubscribed_at IS NULL;

GRANT INSERT, UPDATE ON public.push_subscriptions TO anon, authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can insert own subscription"
  ON public.push_subscriptions FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "anyone can update own subscription"
  ON public.push_subscriptions FOR UPDATE TO anon, authenticated
  USING (true) WITH CHECK (true);

CREATE TABLE public.push_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  body text NOT NULL,
  url text NOT NULL DEFAULT '/',
  schedule_cron text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.push_campaigns TO service_role;

ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.push_campaign_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.push_campaigns(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  run_bucket timestamptz NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  success boolean NOT NULL,
  error text,
  UNIQUE (campaign_id, device_id, run_bucket)
);

CREATE INDEX idx_push_camp_sends_camp ON public.push_campaign_sends (campaign_id, run_bucket);

GRANT ALL ON public.push_campaign_sends TO service_role;

ALTER TABLE public.push_campaign_sends ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_push_subs_updated
  BEFORE UPDATE ON public.push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER trg_push_camp_updated
  BEFORE UPDATE ON public.push_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.push_campaigns (slug, title, body, url, schedule_cron)
VALUES
  ('weekly-escala-check', 'Confira sua escala da semana', 'Veja seus turnos Dejem/Delegada e se prepare para a semana.', '/calendario', '0 12 * * 1'),
  ('monthly-news', 'Novidades do mês no QAP, QRV!', 'Tem coisa nova no app. Dá uma olhada!', '/', '0 13 1 * *');
