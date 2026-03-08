import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AlertStats {
  total: number;
  active: number;
  resolved: number;
  avgResolutionMs: number | null;
  degradedActive: number;
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 24) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function AlertSummaryCard() {
  const [stats, setStats] = useState<AlertStats>({ total: 0, active: 0, resolved: 0, avgResolutionMs: null, degradedActive: 0 });
  const [loading, setLoading] = useState(true);

  function computeStats(alerts: any[]) {
    const total = alerts.length;
    const active = alerts.filter((a: any) => !a.resolved).length;
    const resolved = alerts.filter((a: any) => a.resolved).length;
    const degradedActive = alerts.filter((a: any) => !a.resolved && a.severity === 'degraded').length;

    const resolvedWithTime = alerts.filter((a: any) => a.resolved && a.resolved_at);
    let avgResolutionMs: number | null = null;
    if (resolvedWithTime.length > 0) {
      const totalMs = resolvedWithTime.reduce((sum: number, a: any) => {
        return sum + (new Date(a.resolved_at).getTime() - new Date(a.created_at).getTime());
      }, 0);
      avgResolutionMs = totalMs / resolvedWithTime.length;
    }

    setStats({ total, active, resolved, avgResolutionMs, degradedActive });
  }

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('diagnostic_alerts')
        .select('*');
      if (data) computeStats(data);
      setLoading(false);
    }
    fetch();

    const channel = supabase
      .channel('alert-summary-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'diagnostic_alerts' }, () => {
        // Refetch all for accurate stats
        supabase.from('diagnostic_alerts').select('*').then(({ data }) => {
          if (data) computeStats(data);
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const resolveRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

  const cards = [
    {
      label: 'Total Alerts',
      value: stats.total,
      icon: Activity,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: AlertTriangle,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
      sub: stats.degradedActive > 0 ? `${stats.degradedActive} degraded` : undefined,
    },
    {
      label: 'Resolved',
      value: `${stats.resolved} (${resolveRate}%)`,
      icon: CheckCircle2,
      color: 'text-trust-healthy',
      bg: 'bg-trust-healthy/10',
    },
    {
      label: 'Avg Resolution',
      value: stats.avgResolutionMs !== null ? formatDuration(stats.avgResolutionMs) : '—',
      icon: Clock,
      color: 'text-muted-foreground',
      bg: 'bg-secondary',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-border bg-card p-3 flex items-start gap-3"
        >
          <div className={`p-1.5 rounded ${card.bg}`}>
            <card.icon className={`w-4 h-4 ${card.color}`} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{card.label}</p>
            <p className="text-lg font-bold font-mono text-foreground leading-tight">
              {loading ? '...' : card.value}
            </p>
            {card.sub && (
              <p className="text-[10px] font-mono text-destructive">{card.sub}</p>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}
