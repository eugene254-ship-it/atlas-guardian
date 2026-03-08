
-- Diagnostic alert history
CREATE TABLE public.diagnostic_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('model_drift', 'data_quality', 'bias_detected', 'blind_spot', 'prediction_failure', 'confidence_decay')),
  severity TEXT NOT NULL CHECK (severity IN ('healthy', 'caution', 'degraded')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  target TEXT NOT NULL,
  domain TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Model performance metrics
CREATE TABLE public.model_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  accuracy NUMERIC NOT NULL,
  drift NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'caution', 'degraded')),
  region TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Data source health snapshots
CREATE TABLE public.data_source_health (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  completeness NUMERIC NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy', 'caution', 'degraded')),
  anomaly TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.diagnostic_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_source_health ENABLE ROW LEVEL SECURITY;

-- Public read access for dashboard
CREATE POLICY "Public read access" ON public.diagnostic_alerts FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.model_metrics FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.data_source_health FOR SELECT USING (true);

-- Allow inserts for service operations
CREATE POLICY "Service insert" ON public.diagnostic_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert" ON public.model_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Service insert" ON public.data_source_health FOR INSERT WITH CHECK (true);
