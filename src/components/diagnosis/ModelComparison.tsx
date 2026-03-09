import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitCompareArrows, Check, X, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { models as mockModels } from './mockData';
import type { TrustStatus } from './types';
import { StatusBadge } from './StatusBadge';

interface ModelData {
  id: string;
  name: string;
  status: TrustStatus;
  accuracy: number;
  drift: number;
  region: string;
  history: { date: string; accuracy: number }[];
  source: 'db' | 'mock';
}

const COMPARE_COLORS = [
  'hsl(200 80% 50%)',
  'hsl(0 72% 51%)',
  'hsl(142 72% 45%)',
  'hsl(280 60% 55%)',
  'hsl(45 95% 55%)',
];

export function ModelComparison() {
  const [allModels, setAllModels] = useState<ModelData[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectorOpen, setSelectorOpen] = useState(false);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('model_metrics')
        .select('*')
        .order('recorded_at', { ascending: true });

      const dbModels: ModelData[] = [];
      if (data && data.length > 0) {
        const byModel = new Map<string, typeof data>();
        for (const row of data) {
          if (!byModel.has(row.model_id)) byModel.set(row.model_id, []);
          byModel.get(row.model_id)!.push(row);
        }
        for (const [modelId, records] of byModel) {
          const latest = records[records.length - 1];
          dbModels.push({
            id: modelId,
            name: latest.model_name,
            status: latest.status as TrustStatus,
            accuracy: Math.round(Number(latest.accuracy) * 100),
            drift: Math.round(Number(latest.drift) * 100),
            region: latest.region || 'Global',
            history: records.slice(-12).map(r => ({
              date: new Date(r.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              accuracy: Math.round(Number(r.accuracy) * 100),
            })),
            source: 'db',
          });
        }
      }

      const dbNames = new Set(dbModels.map(m => m.name.toLowerCase()));
      const mockOnly: ModelData[] = mockModels
        .filter(m => !dbNames.has(m.name.toLowerCase()))
        .map(m => ({
          id: m.id,
          name: m.name,
          status: m.status,
          accuracy: m.accuracy,
          drift: m.drift,
          region: m.region,
          history: m.accuracyHistory,
          source: 'mock' as const,
        }));

      setAllModels([...dbModels, ...mockOnly]);
      setLoading(false);
    }
    fetch();
  }, []);

  const selectedModels = allModels.filter(m => selected.includes(m.id));

  // Build unified chart data
  const chartData = (() => {
    if (selectedModels.length === 0) return [];
    const maxLen = Math.max(...selectedModels.map(m => m.history.length));
    const data: Record<string, string | number>[] = [];
    for (let i = 0; i < maxLen; i++) {
      const entry: Record<string, string | number> = { idx: i.toString() };
      for (const m of selectedModels) {
        const point = m.history[i];
        if (point) {
          entry.date = point.date;
          entry[m.name] = point.accuracy;
        }
      }
      data.push(entry);
    }
    return data;
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <GitCompareArrows className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-foreground">Model Comparison</h3>
              {loading && <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Side-by-side drift and accuracy metrics</p>
          </div>

          <div className="relative">
            <button
              onClick={() => setSelectorOpen(!selectorOpen)}
              className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
            >
              {selected.length === 0 ? 'Select Models' : `${selected.length} selected`}
            </button>

            <AnimatePresence>
              {selectorOpen && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setSelectorOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="absolute right-0 top-full mt-1 z-30 w-64 rounded-lg border border-border bg-card p-2 shadow-xl max-h-60 overflow-y-auto"
                  >
                    {allModels.map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelected(prev =>
                            prev.includes(m.id)
                              ? prev.filter(id => id !== m.id)
                              : prev.length >= 5 ? prev : [...prev, m.id]
                          );
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs font-mono transition-colors ${
                          selected.includes(m.id) ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {selected.includes(m.id) ? <Check className="w-3 h-3" /> : <div className="w-3 h-3" />}
                        <span className="flex-1 text-left truncate">{m.name}</span>
                        <StatusBadge status={m.status} className="text-[9px] px-1.5 py-0" />
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {selectedModels.length === 0 ? (
        <div className="p-8 text-center text-xs font-mono text-muted-foreground">
          Select 2+ models above to compare accuracy and drift side-by-side
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Stats comparison table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-normal">Metric</th>
                  {selectedModels.map((m, i) => (
                    <th key={m.id} className="text-center py-2 px-3 font-medium" style={{ color: COMPARE_COLORS[i] }}>
                      <div className="flex items-center justify-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COMPARE_COLORS[i] }} />
                        <span className="truncate max-w-[100px]">{m.name}</span>
                        <button
                          onClick={() => setSelected(prev => prev.filter(id => id !== m.id))}
                          className="text-muted-foreground hover:text-destructive ml-1"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 text-muted-foreground">Status</td>
                  {selectedModels.map(m => (
                    <td key={m.id} className="py-2 px-3 text-center">
                      <StatusBadge status={m.status} className="text-[9px]" />
                    </td>
                  ))}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 text-muted-foreground">Accuracy</td>
                  {selectedModels.map(m => (
                    <td key={m.id} className="py-2 px-3 text-center font-semibold text-foreground">{m.accuracy}%</td>
                  ))}
                </tr>
                <tr className="border-b border-border/50">
                  <td className="py-2 pr-4 text-muted-foreground">Drift</td>
                  {selectedModels.map(m => (
                    <td key={m.id} className={`py-2 px-3 text-center font-semibold ${
                      m.drift > 20 ? 'text-trust-degraded' : m.drift > 10 ? 'text-trust-caution' : 'text-trust-healthy'
                    }`}>-{m.drift}%</td>
                  ))}
                </tr>
                <tr>
                  <td className="py-2 pr-4 text-muted-foreground">Region</td>
                  {selectedModels.map(m => (
                    <td key={m.id} className="py-2 px-3 text-center text-foreground/70">{m.region}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Accuracy history chart */}
          {chartData.length > 0 && (
            <div className="h-52 bg-secondary/20 rounded-lg p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[40, 100]} tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }} axisLine={false} tickLine={false} width={30} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(220 18% 10%)', border: '1px solid hsl(220 15% 18%)', borderRadius: '6px', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}
                    labelStyle={{ color: 'hsl(210 20% 90%)' }}
                  />
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '10px', fontFamily: 'JetBrains Mono, monospace' }} />
                  {selectedModels.map((m, i) => (
                    <Line
                      key={m.id}
                      type="monotone"
                      dataKey={m.name}
                      stroke={COMPARE_COLORS[i]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
