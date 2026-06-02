-- Cancela o cron que invoca a edge function de push remoto (não falha se não existir)
DO $$
BEGIN
  PERFORM cron.unschedule('send-push-tick');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DROP TABLE IF EXISTS public.scheduled_pushes;
DROP TABLE IF EXISTS public.push_subscriptions;