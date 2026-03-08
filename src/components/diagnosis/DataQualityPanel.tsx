import { motion } from 'framer-motion';
import { Database, Clock, AlertCircle } from 'lucide-react';
import { dataSources } from './mockData';
import { StatusBadge } from './StatusBadge';
import type { FilterState } from './DiagnosticFilters';

interface Props {
  filters?: FilterState;
}

export function DataQualityPanel({ filters }: Props) {
  const filtered = dataSources.filter(source => {
    if (filters) {
      if (filters.status !== 'all' && source.status !== filters.status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!source.name.toLowerCase().includes(q) && !source.region.toLowerCase().includes(q)) return false;
      }
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-foreground">Data Quality</h3>
          {filtered.length !== dataSources.length && (
            <span className="text-xs font-mono text-muted-foreground">({filtered.length}/{dataSources.length})</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Source completeness, freshness, and anomaly detection</p>
      </div>

      <div className="divide-y divide-border">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground font-mono">No sources match current filters</div>
        )}
        {filtered.map((source, i) => (
          <motion.div
            key={source.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className="p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-foreground truncate">{source.name}</span>
                  <StatusBadge status={source.status} />
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {source.freshness}
                  </span>
                  <span className="font-mono">{source.region}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-mono font-semibold text-foreground">{source.completeness}%</div>
                <div className="text-xs text-muted-foreground">complete</div>
              </div>
            </div>

            <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${source.completeness}%` }}
                transition={{ duration: 0.8, delay: 0.1 * i }}
                className={`h-full rounded-full ${
                  source.status === 'healthy' ? 'bg-trust-healthy' :
                  source.status === 'caution' ? 'bg-trust-caution' : 'bg-trust-degraded'
                }`}
              />
            </div>

            {source.anomaly && (
              <div className="mt-2 flex items-start gap-1.5 text-xs text-trust-caution bg-trust-caution/5 rounded p-2">
                <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                <span>{source.anomaly}</span>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
