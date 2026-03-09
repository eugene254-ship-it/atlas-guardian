import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface AlertRow {
  id: string;
  created_at: string;
  alert_type: string;
  severity: string;
  resolved: boolean;
}

const ALERT_TYPES = ['model_drift', 'data_quality', 'bias_detected', 'blind_spot', 'prediction_failure', 'confidence_decay'];

const TYPE_COLORS: Record<string, string> = {
  model_drift: 'hsl(0 72% 51%)',
  data_quality: 'hsl(45 95% 55%)',
  bias_detected: 'hsl(200 80% 50%)',
  blind_spot: 'hsl(280 60% 55%)',
  prediction_failure: 'hsl(15 90% 55%)',
  confidence_decay: 'hsl(142 72% 45%)',
};

const TYPE_LABELS: Record<string, string> = {
  model_drift: 'Model Drift',
  data_quality: 'Data Quality',
  bias_detected: 'Bias Detected',
  blind_spot: 'Blind Spot',
  prediction_failure: 'Pred. Failure',
  confidence_decay: 'Conf. Decay',
};

export function AlertFrequencyChart() {
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<7 | 14 | 30>(14);

  useEffect(() => {
    async function fetchAlerts() {
      const { data } = await supabase
        .from('diagnostic_alerts')
        .select('id, created_at, alert_type, severity, resolved')
        .order('created_at', { ascending: true });
      if (data) setAlerts(data as AlertRow[]);
      setLoading(false);
    }
    fetchAlerts();

    const channel = supabase
      .channel('alert-frequency-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'diagnostic_alerts' }, (payload) => {
        setAlerts((prev) => [...prev, payload.new as AlertRow]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Build chart data grouped by day
  const days = eachDayOfInterval({ 
    start: subDays(new Date(), timeRange - 1), 
    end: new Date() 
  });
  
  const chartData = days.map(day => {
    const label = format(day, 'MMM d');
    const dayStr = format(day, 'yyyy-MM-dd');
    const entry: Record<string, number | string> = { date: label };
    
    const dayAlerts = alerts.filter(a => 
      format(new Date(a.created_at), 'yyyy-MM-dd') === dayStr
    );
    
    ALERT_TYPES.forEach(type => {
      entry[type] = dayAlerts.filter(a => a.alert_type === type).length;
    });
    entry._total = dayAlerts.length;
    
    return entry;
  });

  const hasData = chartData.some(d => (d._total as number) > 0);
  const activeTypes = ALERT_TYPES.filter(type => 
    alerts.some(a => a.alert_type === type)
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-accent" />
            <h3 className="font-semibold text-foreground">Alert Frequency</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Alert volume over time by diagnostic category
          </p>
        </div>
        <div className="flex items-center gap-1">
          {([7, 14, 30] as const).map(r => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
                timeRange === r 
                  ? 'bg-primary/15 text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-xs font-mono text-muted-foreground">
            Loading alert data...
          </div>
        ) : !hasData ? (
          <div className="h-48 flex items-center justify-center text-xs font-mono text-muted-foreground">
            No alerts in selected time range
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="15%">
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'hsl(215 15% 50%)' }}
                  axisLine={false}
                  tickLine={false}
                  width={24}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(220 18% 10%)',
                    border: '1px solid hsl(220 15% 18%)',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontFamily: 'JetBrains Mono, monospace',
                  }}
                  labelStyle={{ color: 'hsl(210 20% 90%)' }}
                  cursor={{ fill: 'hsl(220 15% 16% / 0.5)' }}
                  formatter={(value: number, name: string) => [value, TYPE_LABELS[name] || name]}
                />
                {activeTypes.map((type, idx) => (
                  <Bar
                    key={type}
                    dataKey={type}
                    name={type}
                    stackId="a"
                    fill={TYPE_COLORS[type]}
                    fillOpacity={0.85}
                    radius={idx === activeTypes.length - 1 ? [2, 2, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Legend */}
        {activeTypes.length > 0 && (
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-border">
            {activeTypes.map(type => (
              <div key={type} className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                <div 
                  className="w-2.5 h-2.5 rounded-sm" 
                  style={{ backgroundColor: TYPE_COLORS[type] }} 
                />
                {TYPE_LABELS[type]}
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
