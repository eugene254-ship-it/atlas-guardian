import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, ChevronDown, ChevronUp, RefreshCw, Database } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { models as mockModels } from './mockData';
import { StatusBadge } from './StatusBadge';
import type { FilterState } from './DiagnosticFilters';
import type { TrustStatus } from './types';

interface DBModelMetric {
  id: string;
  model_id: string;
  model_name: string;
  accuracy: number;
  drift: number;
  status: string;
  region: string | null;
  recorded_at: string;
}

interface DisplayModel {
  id: string;
  name: string;
  status: TrustStatus;
  accuracy: number;
  drift: number;
  region: string;
  lastCalibrated: string;
  cause: string;
  recommendation: string;
  explanation: string;
  accuracyHistory: { date: string; accuracy: number }[];
  source: 'db' | 'mock';
}

interface Props {
  filters?: FilterState;
}

export function ModelDriftTimeline({ filters }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [dbModels, setDbModels] = useState<DisplayModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDBModels() {
      const { data } = await supabase
        .from('model_metrics')
        .select('*')
        .order('recorded_at', { ascending: true });

      if (data && data.length > 0) {
        // Group by model_id
        const byModel = new Map<string, DBModelMetric[]>();
        for (const row of data as DBModelMetric[]) {
          if (!byModel.has(row.model_id)) byModel.set(row.model_id, []);
          byModel.get(row.model_id)!.push(row);
        }

        const models: DisplayModel[] = [];
        for (const [modelId, records] of byModel) {
          const latest = records[records.length - 1];
          const history = records.slice(-8).map(r => ({
            date: new Date(r.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            accuracy: Math.round(r.accuracy * 100),
          }));

          models.push({
            id: modelId,
            name: latest.model_name,
            status: latest.status as TrustStatus,
            accuracy: Math.round(latest.accuracy * 100),
            drift: Math.round(latest.drift * 100),
            region: latest.region || 'Global',
            lastCalibrated: new Date(latest.recorded_at).toISOString().split('T')[0],
            cause: latest.drift > 0.2 ? 'Significant drift detected in recent predictions' : 'Minor variance within acceptable range',
            recommendation: latest.drift > 0.2 ? 'Retraining recommended' : 'Continue monitoring',
            explanation: `Model ${latest.model_name} has ${latest.status} status with ${Math.round(latest.accuracy * 100)}% accuracy and ${Math.round(latest.drift * 100)}% drift.`,
            accuracyHistory: history,
            source: 'db',
          });
        }
        setDbModels(models);
      }
      setLoading(false);
    }
    fetchDBModels();

    const channel = supabase
      .channel('model-drift-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'model_metrics' }, fetchDBModels)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Combine DB models and mock models (DB takes precedence)
  const dbModelNames = new Set(dbModels.map(m => m.name.toLowerCase()));
  const mockOnlyModels: DisplayModel[] = mockModels
    .filter(m => !dbModelNames.has(m.name.toLowerCase()))
    .map(m => ({ ...m, source: 'mock' as const }));
  
  const allModels = [...dbModels, ...mockOnlyModels];

  const filtered = allModels.filter(model => {
    if (filters) {
      if (filters.status !== 'all' && model.status !== filters.status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!model.name.toLowerCase().includes(q) && !model.region.toLowerCase().includes(q)) return false;
      }
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-foreground">Model Drift Monitor</h3>
          {loading && <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />}
          {filtered.length !== allModels.length && (
            <span className="text-xs font-mono text-muted-foreground">({filtered.length}/{allModels.length})</span>
          )}
          {dbModels.length > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent/15 text-accent ml-auto">
              <Database className="w-2.5 h-2.5 inline mr-1" />
              {dbModels.length} live
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Historical accuracy, drift severity, and recalibration status</p>
      </div>

      <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground font-mono">No models match current filters</div>
        )}
        {filtered.map((model, i) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 * i }}
          >
            <button
              onClick={() => setExpanded(expanded === model.id ? null : model.id)}
              className="w-full p-4 text-left hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-foreground">{model.name}</span>
                    <StatusBadge status={model.status} />
                    {model.source === 'db' && (
                      <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-accent/10 text-accent">LIVE</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-mono">{model.region}</span>
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3" />
                      {model.lastCalibrated}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-mono font-semibold text-foreground">{model.accuracy}%</div>
                    <div className="text-xs text-muted-foreground">accuracy</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-mono font-semibold ${
                      model.drift > 20 ? 'text-trust-degraded' : model.drift > 10 ? 'text-trust-caution' : 'text-trust-healthy'
                    }`}>-{model.drift}%</div>
                    <div className="text-xs text-muted-foreground">drift</div>
                  </div>
                  {expanded === model.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </div>
            </button>

            <AnimatePresence>
              {expanded === model.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4">
                    <div className="h-40 bg-secondary/30 rounded-lg p-3">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={model.accuracyHistory}>
                          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }} axisLine={false} tickLine={false} />
                          <YAxis domain={[50, 100]} tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }} axisLine={false} tickLine={false} width={30} />
                          <ReferenceLine y={80} stroke="hsl(45 95% 55%)" strokeDasharray="3 3" strokeOpacity={0.5} />
                          <Tooltip
                            contentStyle={{ background: 'hsl(220 18% 10%)', border: '1px solid hsl(220 15% 18%)', borderRadius: '6px', fontSize: '12px' }}
                            labelStyle={{ color: 'hsl(210 20% 90%)' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="accuracy"
                            stroke={model.status === 'degraded' ? 'hsl(0 72% 51%)' : model.status === 'caution' ? 'hsl(45 95% 55%)' : 'hsl(142 72% 45%)'}
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-secondary/20 rounded-lg p-3 border border-border">
                      <p className="text-sm text-foreground/80 leading-relaxed">{model.explanation}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-secondary/30 rounded p-2">
                        <span className="text-muted-foreground">Cause Signals</span>
                        <p className="text-foreground mt-0.5">{model.cause}</p>
                      </div>
                      <div className="bg-secondary/30 rounded p-2">
                        <span className="text-muted-foreground">Recommendation</span>
                        <p className="text-foreground mt-0.5">{model.recommendation}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
