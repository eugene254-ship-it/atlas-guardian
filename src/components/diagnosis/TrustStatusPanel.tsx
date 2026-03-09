import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Activity, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { StatusBadge } from './StatusBadge';
import { blindSpots } from './mockData';
import type { TrustStatus } from './types';

interface LiveStats {
  degradedModels: number;
  cautionModels: number;
  healthyModels: number;
  activeAlerts: number;
  dataIssues: number;
  lastScan: string | null;
}

function computeTrustScore(stats: LiveStats): { status: TrustStatus; score: number } {
  let score = 100;
  
  // Degraded models heavily impact score
  score -= stats.degradedModels * 15;
  // Caution models moderately impact
  score -= stats.cautionModels * 5;
  // Active alerts impact score
  score -= Math.min(stats.activeAlerts * 2, 15);
  // Data issues impact
  score -= stats.dataIssues * 3;
  
  score = Math.max(0, Math.min(100, score));
  
  let status: TrustStatus = 'healthy';
  if (score < 65 || stats.degradedModels > 0) status = 'degraded';
  else if (score < 85 || stats.cautionModels > 1) status = 'caution';
  
  return { status, score };
}

const statusColors: Record<TrustStatus, string> = {
  healthy: 'text-trust-healthy',
  caution: 'text-trust-caution',
  degraded: 'text-trust-degraded',
};

const glowClasses: Record<TrustStatus, string> = {
  healthy: 'atlas-glow-healthy',
  caution: 'atlas-glow-caution',
  degraded: 'atlas-glow-degraded',
};

export function TrustStatusPanel() {
  const [stats, setStats] = useState<LiveStats>({
    degradedModels: 0,
    cautionModels: 0,
    healthyModels: 0,
    activeAlerts: 0,
    dataIssues: 0,
    lastScan: null,
  });
  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    // Fetch latest model metrics (group by model_id, take latest)
    const { data: modelData } = await supabase
      .from('model_metrics')
      .select('model_id, status, recorded_at')
      .order('recorded_at', { ascending: false });

    const latestByModel = new Map<string, { status: string; recorded_at: string }>();
    for (const m of modelData || []) {
      if (!latestByModel.has(m.model_id)) {
        latestByModel.set(m.model_id, m);
      }
    }

    let degradedModels = 0, cautionModels = 0, healthyModels = 0;
    let lastScan: string | null = null;
    
    for (const [, m] of latestByModel) {
      if (m.status === 'degraded') degradedModels++;
      else if (m.status === 'caution') cautionModels++;
      else healthyModels++;
      if (!lastScan || new Date(m.recorded_at) > new Date(lastScan)) {
        lastScan = m.recorded_at;
      }
    }

    // Fetch active alerts count
    const { count: activeAlerts } = await supabase
      .from('diagnostic_alerts')
      .select('*', { count: 'exact', head: true })
      .eq('resolved', false);

    // Fetch data source health issues
    const { data: sourceData } = await supabase
      .from('data_source_health')
      .select('source_id, status')
      .order('recorded_at', { ascending: false });

    const latestBySource = new Map<string, string>();
    for (const s of sourceData || []) {
      if (!latestBySource.has(s.source_id)) {
        latestBySource.set(s.source_id, s.status);
      }
    }
    
    let dataIssues = 0;
    for (const [, status] of latestBySource) {
      if (status !== 'healthy') dataIssues++;
    }

    setStats({
      degradedModels,
      cautionModels,
      healthyModels,
      activeAlerts: activeAlerts || 0,
      dataIssues,
      lastScan,
    });
    setLoading(false);
  }

  useEffect(() => {
    fetchStats();

    // Subscribe to changes for live updates
    const channel = supabase
      .channel('trust-panel-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'model_metrics' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'diagnostic_alerts' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'data_source_health' }, fetchStats)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const { status, score } = computeTrustScore(stats);
  const totalModels = stats.degradedModels + stats.cautionModels + stats.healthyModels;
  const activeBlindSpots = blindSpots.length;

  const statItems = [
    { 
      icon: AlertTriangle, 
      label: 'Model Issues', 
      value: stats.degradedModels + stats.cautionModels,
      sub: `${stats.degradedModels} degraded · ${stats.cautionModels} caution`,
      highlight: stats.degradedModels > 0,
    },
    { 
      icon: Activity, 
      label: 'Active Alerts', 
      value: stats.activeAlerts, 
      sub: `${stats.dataIssues} data issues`,
      highlight: stats.activeAlerts > 5,
    },
    { 
      icon: Eye, 
      label: 'Blind Spots', 
      value: activeBlindSpots, 
      sub: 'documented gaps',
      highlight: false,
    },
  ];

  const formatLastScan = () => {
    if (!stats.lastScan) return 'No scans yet';
    const diff = Date.now() - new Date(stats.lastScan).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border border-border bg-card p-6 ${glowClasses[status]}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-lg bg-secondary ${statusColors[status]}`}>
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">Atlas Trust Score</h2>
              <StatusBadge status={status} />
              {loading && (
                <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin" />
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-4xl font-mono font-bold ${statusColors[status]}`}>
                {loading ? '—' : score}
              </span>
              <span className="text-sm text-muted-foreground font-mono">/100</span>
            </div>
          </div>
        </div>

        <div className="flex gap-6 md:gap-8">
          {statItems.map(({ icon: Icon, label, value, sub, highlight }) => (
            <div key={label} className="text-center">
              <Icon className={`w-4 h-4 mx-auto mb-1 ${highlight ? 'text-destructive' : 'text-muted-foreground'}`} />
              <div className={`text-2xl font-mono font-bold ${highlight ? 'text-destructive' : 'text-foreground'}`}>
                {loading ? '—' : value}
              </div>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-[10px] text-muted-foreground/70 font-mono">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          {status === 'degraded' && 'Atlas has identified significant reliability issues. One or more models have drifted beyond acceptable thresholds. Automated recommendations from affected models should be treated with increased scrutiny.'}
          {status === 'caution' && 'Atlas is operating with moderate confidence. Some data sources show delays and select models exhibit early drift. Monitor closely.'}
          {status === 'healthy' && 'All systems operating within normal parameters. Data pipelines active and models calibrated.'}
        </p>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-mono text-muted-foreground">Last scan</div>
          <div className="text-xs font-mono text-foreground">{formatLastScan()}</div>
          {totalModels > 0 && (
            <div className="text-[10px] font-mono text-muted-foreground mt-1">
              {totalModels} models tracked
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
