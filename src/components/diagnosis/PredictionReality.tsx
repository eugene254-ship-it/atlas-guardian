import { motion } from 'framer-motion';
import { Target, CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { predictions } from './mockData';
import type { FilterState } from './DiagnosticFilters';

const statusConfig = {
  accurate: { icon: CheckCircle, color: 'text-trust-healthy', bg: 'bg-trust-healthy/10' },
  degraded: { icon: AlertTriangle, color: 'text-trust-caution', bg: 'bg-trust-caution/10' },
  failed: { icon: XCircle, color: 'text-trust-degraded', bg: 'bg-trust-degraded/10' },
  pending: { icon: Clock, color: 'text-trust-unknown', bg: 'bg-trust-unknown/10' },
};

interface Props {
  filters?: FilterState;
}

export function PredictionReality({ filters }: Props) {
  const filtered = predictions.filter(pred => {
    if (filters) {
      if (filters.status !== 'all') {
        const statusMap: Record<string, string> = { accurate: 'healthy', degraded: 'caution', failed: 'degraded' };
        if ((statusMap[pred.status] || pred.status) !== filters.status) return false;
      }
      if (filters.domain && !pred.domain.toLowerCase().includes(filters.domain.toLowerCase())) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!pred.model.toLowerCase().includes(q) && !pred.domain.toLowerCase().includes(q)) return false;
      }
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-foreground">Prediction vs Reality</h3>
          {filtered.length !== predictions.length && (
            <span className="text-xs font-mono text-muted-foreground">({filtered.length}/{predictions.length})</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Track record — showing where Atlas was right, wrong, and uncertain</p>
      </div>

      <div className="divide-y divide-border">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground font-mono">No predictions match current filters</div>
        )}
        {filtered.map((pred, i) => {
          const config = statusConfig[pred.status];
          const Icon = config.icon;
          const missDistance = pred.actual !== null
            ? Math.round(Math.abs(pred.predicted - pred.actual) / pred.predicted * 100)
            : null;

          return (
            <motion.div
              key={pred.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 * i }}
              className="p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${config.color}`} />
                    <span className="font-medium text-sm text-foreground">{pred.model}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${config.bg} ${config.color}`}>
                      {pred.status}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {pred.domain} · Issued {pred.issuedDate}
                  </div>
                </div>
                <div className="text-right font-mono text-xs text-muted-foreground">
                  <span>{pred.confidence}% conf</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="bg-secondary/30 rounded p-2 text-center">
                  <div className="text-xs text-muted-foreground">Predicted</div>
                  <div className="text-sm font-mono font-semibold text-foreground">{pred.predicted.toLocaleString()}</div>
                </div>
                <div className="bg-secondary/30 rounded p-2 text-center">
                  <div className="text-xs text-muted-foreground">Actual</div>
                  <div className="text-sm font-mono font-semibold text-foreground">
                    {pred.actual !== null ? pred.actual.toLocaleString() : '—'}
                  </div>
                </div>
                <div className="bg-secondary/30 rounded p-2 text-center">
                  <div className="text-xs text-muted-foreground">Miss</div>
                  <div className={`text-sm font-mono font-semibold ${
                    missDistance === null ? 'text-muted-foreground' :
                    missDistance > 25 ? 'text-trust-degraded' :
                    missDistance > 10 ? 'text-trust-caution' : 'text-trust-healthy'
                  }`}>
                    {missDistance !== null ? `${missDistance}%` : '—'}
                  </div>
                </div>
              </div>

              <p className="text-xs text-foreground/70 leading-relaxed">{pred.explanation}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
