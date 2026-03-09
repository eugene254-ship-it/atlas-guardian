import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Clock, Rewind } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { StatusBadge } from './StatusBadge';
import type { TrustStatus } from './types';

interface TimelineDay {
  date: Date;
  label: string;
  alerts: { total: number; active: number; degraded: number };
  models: { name: string; status: string; accuracy: number; drift: number }[];
  dataSources: { name: string; status: string; completeness: number }[];
}

export function HistoricalPlayback() {
  const [days, setDays] = useState<TimelineDay[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<14 | 30 | 60>(30);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      const dateRange = eachDayOfInterval({
        start: subDays(new Date(), range - 1),
        end: new Date(),
      });

      // Fetch all data
      const [alertsRes, metricsRes, sourcesRes] = await Promise.all([
        supabase.from('diagnostic_alerts').select('*').order('created_at', { ascending: true }),
        supabase.from('model_metrics').select('*').order('recorded_at', { ascending: true }),
        supabase.from('data_source_health').select('*').order('recorded_at', { ascending: true }),
      ]);

      const alerts = alertsRes.data || [];
      const metrics = metricsRes.data || [];
      const sources = sourcesRes.data || [];

      const timeline: TimelineDay[] = dateRange.map(day => {
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        const dayStr = format(day, 'yyyy-MM-dd');

        // Alerts active as of this day
        const dayAlerts = alerts.filter(a => new Date(a.created_at) <= dayEnd);
        const activeAlerts = dayAlerts.filter(a => !a.resolved || (a.resolved_at && new Date(a.resolved_at) > dayEnd));
        const degradedAlerts = activeAlerts.filter(a => a.severity === 'degraded');

        // Latest model metrics as of this day
        const dayMetrics = metrics.filter(m => new Date(m.recorded_at) <= dayEnd);
        const latestByModel = new Map<string, typeof metrics[0]>();
        for (const m of dayMetrics) {
          if (!latestByModel.has(m.model_id) || new Date(m.recorded_at) > new Date(latestByModel.get(m.model_id)!.recorded_at)) {
            latestByModel.set(m.model_id, m);
          }
        }

        // Latest source health as of this day
        const daySources = sources.filter(s => new Date(s.recorded_at) <= dayEnd);
        const latestBySource = new Map<string, typeof sources[0]>();
        for (const s of daySources) {
          if (!latestBySource.has(s.source_id) || new Date(s.recorded_at) > new Date(latestBySource.get(s.source_id)!.recorded_at)) {
            latestBySource.set(s.source_id, s);
          }
        }

        return {
          date: day,
          label: format(day, 'MMM d'),
          alerts: {
            total: dayAlerts.length,
            active: activeAlerts.length,
            degraded: degradedAlerts.length,
          },
          models: Array.from(latestByModel.values()).map(m => ({
            name: m.model_name,
            status: m.status,
            accuracy: Math.round(Number(m.accuracy) * 100),
            drift: Math.round(Number(m.drift) * 100),
          })),
          dataSources: Array.from(latestBySource.values()).map(s => ({
            name: s.source_name,
            status: s.status,
            completeness: Math.round(Number(s.completeness)),
          })),
        };
      });

      setDays(timeline);
      setCurrentIdx(timeline.length - 1);
      setLoading(false);
    }
    fetchHistory();
  }, [range]);

  // Playback
  useEffect(() => {
    if (!playing || days.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIdx(prev => {
        if (prev >= days.length - 1) {
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 600);
    return () => clearInterval(timer);
  }, [playing, days.length]);

  const current = days[currentIdx];

  const stepBack = useCallback(() => setCurrentIdx(i => Math.max(0, i - 1)), []);
  const stepForward = useCallback(() => setCurrentIdx(i => Math.min(days.length - 1, i + 1)), [days.length]);
  const jumpToStart = useCallback(() => { setCurrentIdx(0); setPlaying(false); }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              <h3 className="font-semibold text-foreground">Historical Playback</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Scrub through past states of alerts, models, and data sources</p>
          </div>
          <div className="flex items-center gap-1">
            {([14, 30, 60] as const).map(r => (
              <button
                key={r}
                onClick={() => { setRange(r); setPlaying(false); }}
                className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
                  range === r ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r}d
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs font-mono text-muted-foreground">Loading historical data...</div>
      ) : !current ? (
        <div className="p-8 text-center text-xs font-mono text-muted-foreground">No historical data available</div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Timeline scrubber */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground">
              <span>{days[0]?.label}</span>
              <span className="text-foreground font-medium">{current.label}</span>
              <span>{days[days.length - 1]?.label}</span>
            </div>
            <input
              type="range"
              min={0}
              max={days.length - 1}
              value={currentIdx}
              onChange={e => { setCurrentIdx(Number(e.target.value)); setPlaying(false); }}
              className="w-full h-1.5 rounded-full bg-secondary appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md"
            />
          </div>

          {/* Playback controls */}
          <div className="flex items-center justify-center gap-2">
            <button onClick={jumpToStart} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Rewind className="w-4 h-4" />
            </button>
            <button onClick={stepBack} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPlaying(!playing)}
              className={`p-2 rounded-full transition-colors ${
                playing ? 'bg-primary/15 text-primary' : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={stepForward} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* State snapshot */}
          <div className="grid grid-cols-3 gap-3 text-xs font-mono">
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
              <div className="text-muted-foreground text-[10px] uppercase mb-1">Total Alerts</div>
              <div className="text-xl font-bold text-foreground">{current.alerts.total}</div>
              <div className="text-[10px] text-destructive">{current.alerts.active} active</div>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
              <div className="text-muted-foreground text-[10px] uppercase mb-1">Degraded</div>
              <div className={`text-xl font-bold ${current.alerts.degraded > 0 ? 'text-trust-degraded' : 'text-trust-healthy'}`}>
                {current.alerts.degraded}
              </div>
              <div className="text-[10px] text-muted-foreground">alerts</div>
            </div>
            <div className="rounded-lg border border-border bg-secondary/30 p-3 text-center">
              <div className="text-muted-foreground text-[10px] uppercase mb-1">Models</div>
              <div className="text-xl font-bold text-foreground">{current.models.length}</div>
              <div className="text-[10px] text-muted-foreground">tracked</div>
            </div>
          </div>

          {/* Model states */}
          {current.models.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Model States</p>
              <div className="divide-y divide-border/50">
                {current.models.map(m => (
                  <div key={m.name} className="flex items-center justify-between py-1.5 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-foreground truncate max-w-[160px]">{m.name}</span>
                      <StatusBadge status={m.status as TrustStatus} className="text-[9px] px-1.5 py-0" />
                    </div>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-foreground">{m.accuracy}%</span>
                      <span className={m.drift > 20 ? 'text-trust-degraded' : m.drift > 10 ? 'text-trust-caution' : 'text-trust-healthy'}>
                        -{m.drift}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data source states */}
          {current.dataSources.length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Data Sources</p>
              <div className="divide-y divide-border/50">
                {current.dataSources.map(s => (
                  <div key={s.name} className="flex items-center justify-between py-1.5 px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-foreground truncate max-w-[160px]">{s.name}</span>
                      <StatusBadge status={s.status as TrustStatus} className="text-[9px] px-1.5 py-0" />
                    </div>
                    <span className="text-xs font-mono text-foreground">{s.completeness}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
