import { motion } from 'framer-motion';
import { Wrench, RotateCcw, Database, Users, ChevronDown, Pause, BarChart3 } from 'lucide-react';
import { recommendations } from './mockData';
import { StatusBadge } from './StatusBadge';
import type { FilterState } from './DiagnosticFilters';

const typeConfig = {
  retrain: { icon: RotateCcw, label: 'Retrain Model' },
  collect_data: { icon: Database, label: 'Collect Data' },
  human_review: { icon: Users, label: 'Human Review' },
  downweight: { icon: ChevronDown, label: 'Downweight Source' },
  widen_uncertainty: { icon: BarChart3, label: 'Widen Uncertainty' },
  pause: { icon: Pause, label: 'Pause Output' },
};

interface Props {
  filters?: FilterState;
}

export function RecommendationEngine({ filters }: Props) {
  const filtered = recommendations.filter(rec => {
    if (filters) {
      if (filters.status !== 'all' && rec.priority !== filters.status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        if (!rec.target.toLowerCase().includes(q) && !rec.description.toLowerCase().includes(q)) return false;
      }
    }
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-foreground">Self-Repair Recommendations</h3>
          {filtered.length !== recommendations.length && (
            <span className="text-xs font-mono text-muted-foreground">({filtered.length}/{recommendations.length})</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Suggested corrective actions to restore system integrity</p>
      </div>

      <div className="divide-y divide-border">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-xs text-muted-foreground font-mono">No recommendations match current filters</div>
        )}
        {filtered.map((rec, i) => {
          const config = typeConfig[rec.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.05 * i }}
              className="p-4 hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-secondary shrink-0">
                  <Icon className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/10 text-accent">{config.label}</span>
                    <StatusBadge status={rec.priority} />
                  </div>
                  <p className="text-sm font-medium text-foreground mb-1">{rec.description}</p>
                  <p className="text-xs text-muted-foreground font-mono mb-1">Target: {rec.target}</p>
                  <p className="text-xs text-foreground/70 leading-relaxed">{rec.explanation}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
