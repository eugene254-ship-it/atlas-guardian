
-- Enable extensions for cron
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Allow anon users to update resolved status on alerts
CREATE POLICY "Public update resolved" ON public.diagnostic_alerts
  FOR UPDATE USING (true) WITH CHECK (true);
