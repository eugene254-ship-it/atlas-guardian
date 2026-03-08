import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, AlertTriangle } from 'lucide-react';
import { biasRegions } from './mockData';
import { StatusBadge } from './StatusBadge';
import type { TrustStatus } from './types';

const severityScale: Record<TrustStatus, { bg: string; ring: string; pulse: string }> = {
  healthy: { bg: 'bg-trust-healthy/20', ring: 'ring-trust-healthy/40', pulse: '' },
  caution: { bg: 'bg-trust-caution/20', ring: 'ring-trust-caution/40', pulse: 'animate-pulse-glow' },
  degraded: { bg: 'bg-trust-degraded/20', ring: 'ring-trust-degraded/40', pulse: 'animate-pulse-glow' },
};

export function BiasDetectionMap() {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="rounded-lg border border-border bg-card"
    >
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent" />
          <h3 className="font-semibold text-foreground">Bias Detection Map</h3>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Geographic and demographic data skew across regions</p>
      </div>

      {/* Spatial map visualization */}
      <div className="p-4">
        <div className="relative bg-secondary/20 rounded-lg border border-border overflow-hidden" style={{ height: 280 }}>
          {/* Grid overlay */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }} />

          {/* Region nodes positioned on abstract map */}
          {biasRegions.map((region) => (
            <motion.button
              key={region.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring' }}
              onClick={() => setSelected(selected === region.id ? null : region.id)}
              className={`absolute flex items-center justify-center rounded-full ring-2 transition-all cursor-pointer
                ${severityScale[region.severity].bg} ${severityScale[region.severity].ring} ${severityScale[region.severity].pulse}
                ${selected === region.id ? 'z-20 scale-125' : 'z-10 hover:scale-110'}
              `}
              style={{
                left: `${region.x}%`,
                top: `${region.y}%`,
                width: `${Math.max(32, region.skewFactor * 12)}px`,
                height: `${Math.max(32, region.skewFactor * 12)}px`,
                transform: 'translate(-50%, -50%)',
              }}
              title={region.name}
            >
              <span className="text-[10px] font-mono font-bold text-foreground">{region.skewFactor}x</span>
            </motion.button>
          ))}

          {/* Labels */}
          {biasRegions.map((region) => (
            <div
              key={`label-${region.id}`}
              className="absolute text-[9px] font-mono text-muted-foreground pointer-events-none whitespace-nowrap"
              style={{
                left: `${region.x}%`,
                top: `calc(${region.y}% + ${Math.max(20, region.skewFactor * 7)}px)`,
                transform: 'translateX(-50%)',
              }}
            >
              {region.name}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-trust-healthy/30 ring-1 ring-trust-healthy/50" />
            <span>Balanced</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-trust-caution/30 ring-1 ring-trust-caution/50" />
            <span>Skewed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-trust-degraded/30 ring-1 ring-trust-degraded/50" />
            <span>Severe bias</span>
          </div>
          <span className="ml-auto font-mono">Node size = skew magnitude</span>
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (() => {
          const region = biasRegions.find(r => r.id === selected);
          if (!region) return null;
          return (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{region.name}</span>
                  <StatusBadge status={region.severity} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-secondary/30 rounded p-2 text-center">
                    <div className="text-muted-foreground">Skew Factor</div>
                    <div className="text-sm font-mono font-semibold text-foreground">{region.skewFactor}x</div>
                  </div>
                  <div className="bg-secondary/30 rounded p-2 text-center">
                    <div className="text-muted-foreground">Data Sources</div>
                    <div className="text-sm font-mono font-semibold text-foreground">{region.sourceCount}</div>
                  </div>
                  <div className="bg-secondary/30 rounded p-2 text-center">
                    <div className="text-muted-foreground">Coverage</div>
                    <div className="text-sm font-mono font-semibold text-foreground">{region.coverage}%</div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {region.biasFactors.map((factor) => (
                    <div key={factor} className="flex items-center gap-2 text-xs">
                      <AlertTriangle className="w-3 h-3 text-trust-caution shrink-0" />
                      <span className="text-foreground/80">{factor}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-foreground/70 leading-relaxed bg-secondary/20 rounded p-2 border border-border">
                  {region.explanation}
                </p>

                <div className="flex flex-wrap gap-1.5">
                  {region.affectedModels.map(m => (
                    <span key={m} className="text-xs px-2 py-0.5 rounded bg-accent/10 text-accent font-mono">{m}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
}
