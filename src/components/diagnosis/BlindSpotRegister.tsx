import { motion } from 'framer-motion';
import { EyeOff, Tag } from 'lucide-react';
import { blindSpots } from './mockData';
import { StatusBadge } from './StatusBadge';
import type { FilterState } from './DiagnosticFilters';

interface Props {
  filters?: FilterState;
}

export function BlindSpotRegister({ filters }: Props) {
  const filtered = blindSpots.filter(spot => {
    if (filters) {
      if (filters.status !== 'all' && spot.severity !== filters.status) return false;
      if (filters.domain && !spot.affectedDomains.some(d => d.toLowerCase().includes(filters.domain.toLowerCase()))) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!spot.description.toLowerCase().includes(q) && !spot.category.toLowerCase().includes(q)) return false;
      }
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-foreground">Blind Spot Register</h3>
          {filtered.length !== blindSpots.length && (
            <span className="text-xs font-mono text-muted-foreground">({filtered.length}/{blindSpots.length})</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">What Atlas does not know — surfaced, not hidden</p>
      </div>

      <div className="divide-y divide-border">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground font-mono">No blind spots match current filters</div>
        )}
        {filtered.map((spot, i) => (
          <motion.div
            key={spot.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className="p-4 hover:bg-secondary/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground">{spot.category}</span>
                  <StatusBadge status={spot.severity} />
                </div>
                <p className="text-sm font-medium text-foreground">{spot.description}</p>
              </div>
            </div>

            <p className="text-xs text-foreground/70 leading-relaxed mb-2">{spot.explanation}</p>

            <div className="flex flex-wrap gap-1.5 mb-2">
              {spot.missingVariables.map(v => (
                <span key={v} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-trust-degraded/10 text-trust-degraded border border-trust-degraded/20">
                  <Tag className="w-2.5 h-2.5" />
                  {v}
                </span>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {spot.affectedDomains.map(d => (
                <span key={d} className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-mono">{d}</span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
