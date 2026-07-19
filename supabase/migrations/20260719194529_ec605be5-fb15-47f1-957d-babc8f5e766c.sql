
CREATE TABLE public.marca_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('dejem','delegada')),
  data_alvo date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX marca_events_tipo_created_idx ON public.marca_events (tipo, created_at DESC);
CREATE INDEX marca_events_device_tipo_idx ON public.marca_events (device_id, tipo, created_at DESC);

GRANT INSERT ON public.marca_events TO anon, authenticated;
GRANT ALL ON public.marca_events TO service_role;

ALTER TABLE public.marca_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert marca event"
  ON public.marca_events FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE TABLE public.push_burst_sends (
  device_id text NOT NULL,
  tipo text NOT NULL,
  sent_on date NOT NULL DEFAULT current_date,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (device_id, tipo, sent_on)
);

GRANT ALL ON public.push_burst_sends TO service_role;

ALTER TABLE public.push_burst_sends ENABLE ROW LEVEL SECURITY;
