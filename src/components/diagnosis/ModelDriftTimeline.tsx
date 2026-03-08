import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingDown, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { models } from './mockData';
import { StatusBadge } from './StatusBadge';

export function ModelDriftTimeline() {
  const [expanded, setExpanded] = useState<string | null>(null);

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
        </div>
        <p className="text-xs text-muted-foreground mt-1">Historical accuracy, drift severity, and recalibration status</p>
      </div>

      <div className="divide-y divide-border">
        {models.map((model, i) => (
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
                    {/* Chart */}
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

                    {/* Explanation */}
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
