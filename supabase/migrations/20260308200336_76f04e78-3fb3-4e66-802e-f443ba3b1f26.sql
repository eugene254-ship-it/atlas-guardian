
-- Tighten insert policies to require service_role
DROP POLICY "Service insert" ON public.diagnostic_alerts;
DROP POLICY "Service insert" ON public.model_metrics;
DROP POLICY "Service insert" ON public.data_source_health;

CREATE POLICY "Service role insert" ON public.diagnostic_alerts FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role insert" ON public.model_metrics FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service role insert" ON public.data_source_health FOR INSERT TO service_role WITH CHECK (true);
