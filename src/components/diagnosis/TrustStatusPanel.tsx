import { motion } from 'framer-motion';
import { Shield, AlertTriangle, Activity, Eye } from 'lucide-react';
import { models, dataSources, blindSpots } from './mockData';
import { StatusBadge } from './StatusBadge';
import type { TrustStatus } from './types';

function getOverallStatus(): { status: TrustStatus; score: number } {
  const degradedCount = models.filter(m => m.status === 'degraded').length;
  const cautionCount = models.filter(m => m.status === 'caution').length;
  if (degradedCount > 0) return { status: 'degraded', score: 62 };
  if (cautionCount > 1) return { status: 'caution', score: 78 };
  return { status: 'healthy', score: 92 };
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
  const { status, score } = getOverallStatus();
  const degradedModels = models.filter(m => m.status === 'degraded').length;
  const cautionModels = models.filter(m => m.status === 'caution').length;
  const degradedSources = dataSources.filter(d => d.status !== 'healthy').length;
  const activeBlindSpots = blindSpots.length;

  const stats = [
    { icon: AlertTriangle, label: 'Degraded Models', value: degradedModels, sub: `${cautionModels} caution` },
    { icon: Activity, label: 'Data Issues', value: degradedSources, sub: `of ${dataSources.length} sources` },
    { icon: Eye, label: 'Blind Spots', value: activeBlindSpots, sub: 'active alerts' },
  ];

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
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className={`text-4xl font-mono font-bold ${statusColors[status]}`}>{score}</span>
              <span className="text-sm text-muted-foreground font-mono">/100</span>
            </div>
          </div>
        </div>

        <div className="flex gap-6 md:gap-8">
          {stats.map(({ icon: Icon, label, value, sub }) => (
            <div key={label} className="text-center">
              <Icon className="w-4 h-4 mx-auto mb-1 text-muted-foreground" />
              <div className="text-2xl font-mono font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
              <div className="text-xs text-muted-foreground/70">{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {status === 'degraded' && 'Atlas has identified significant reliability issues. One or more models have drifted beyond acceptable thresholds. Automated recommendations from affected models should be treated with increased scrutiny.'}
          {status === 'caution' && 'Atlas is operating with moderate confidence. Some data sources show delays and select models exhibit early drift. Monitor closely.'}
          {status === 'healthy' && 'All systems operating within normal parameters. Data pipelines active and models calibrated.'}
        </p>
      </div>
    </motion.div>
  );
}
