import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch latest model metrics
  const { data: models, error: modelsErr } = await supabase
    .from("model_metrics")
    .select("*")
    .order("recorded_at", { ascending: false });

  if (modelsErr) {
    return new Response(JSON.stringify({ error: modelsErr.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Get latest metric per model
  const latestByModel = new Map<string, any>();
  for (const m of models || []) {
    if (!latestByModel.has(m.model_id)) {
      latestByModel.set(m.model_id, m);
    }
  }

  const alerts: any[] = [];

  for (const [, metric] of latestByModel) {
    // High drift check
    if (metric.drift > 0.15) {
      alerts.push({
        alert_type: "model_drift",
        severity: metric.drift > 0.25 ? "degraded" : "caution",
        title: `High drift detected: ${metric.model_name}`,
        description: `Model ${metric.model_name} has a drift value of ${metric.drift}, exceeding the acceptable threshold.`,
        target: metric.model_name,
        domain: metric.region,
      });
    }

    // Low accuracy check
    if (metric.accuracy < 0.75) {
      alerts.push({
        alert_type: "prediction_failure",
        severity: metric.accuracy < 0.6 ? "degraded" : "caution",
        title: `Low accuracy: ${metric.model_name}`,
        description: `Model ${metric.model_name} accuracy has dropped to ${(metric.accuracy * 100).toFixed(1)}%.`,
        target: metric.model_name,
        domain: metric.region,
      });
    }
  }

  // Check data source health
  const { data: sources } = await supabase
    .from("data_source_health")
    .select("*")
    .order("recorded_at", { ascending: false });

  const latestBySource = new Map<string, any>();
  for (const s of sources || []) {
    if (!latestBySource.has(s.source_id)) {
      latestBySource.set(s.source_id, s);
    }
  }

  for (const [, source] of latestBySource) {
    if (source.completeness < 0.7) {
      alerts.push({
        alert_type: "data_quality",
        severity: source.completeness < 0.5 ? "degraded" : "caution",
        title: `Low completeness: ${source.source_name}`,
        description: `Data source ${source.source_name} completeness is at ${(source.completeness * 100).toFixed(1)}%.`,
        target: source.source_name,
      });
    }

    if (source.anomaly) {
      alerts.push({
        alert_type: "data_quality",
        severity: "caution",
        title: `Anomaly in ${source.source_name}`,
        description: `Detected anomaly: ${source.anomaly}`,
        target: source.source_name,
      });
    }
  }

  // Insert new alerts
  let inserted = 0;
  if (alerts.length > 0) {
    const { error: insertErr } = await supabase
      .from("diagnostic_alerts")
      .insert(alerts);
    if (!insertErr) inserted = alerts.length;
  }

  return new Response(
    JSON.stringify({
      checked_models: latestByModel.size,
      checked_sources: latestBySource.size,
      alerts_generated: inserted,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
