-- Reconfigura cron pra chamar a Edge Function send-push a cada minuto.
-- Remove jobs antigos que apontavam pra rotas TSS inexistentes.

DO $$
DECLARE
  j RECORD;
BEGIN
  FOR j IN SELECT jobname FROM cron.job WHERE jobname IN ('send-push-tick', 'drain-scheduled-pushes', 'push-send-tick') LOOP
    PERFORM cron.unschedule(j.jobname);
  END LOOP;
END $$;

SELECT cron.schedule(
  'send-push-tick',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://xkpvtfqeqwvaxdumbknc.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrcHZ0ZnFlcXd2YXhkdW1ia25jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyODUwNTcsImV4cCI6MjA5NTg2MTA1N30.sF0aXySQsIz5p4Y1QVfsli1rK8B9QmTVqYZ2TmUcqMc'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);