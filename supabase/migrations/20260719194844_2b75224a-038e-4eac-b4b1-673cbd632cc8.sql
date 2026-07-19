
CREATE TABLE public.push_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text NOT NULL,
  marca_key text NOT NULL,
  reminder_index int NOT NULL DEFAULT 0,
  when_at timestamptz NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  url text NOT NULL DEFAULT '/calendario',
  tag text,
  sent_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (device_id, marca_key, reminder_index)
);

GRANT ALL ON public.push_reminders TO service_role;

ALTER TABLE public.push_reminders ENABLE ROW LEVEL SECURITY;

-- Nenhuma policy para anon/authenticated: acesso apenas via edge function (service_role).

CREATE INDEX push_reminders_due_idx
  ON public.push_reminders (when_at)
  WHERE sent_at IS NULL;

CREATE INDEX push_reminders_device_marca_idx
  ON public.push_reminders (device_id, marca_key);

CREATE TRIGGER push_reminders_touch
  BEFORE UPDATE ON public.push_reminders
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
