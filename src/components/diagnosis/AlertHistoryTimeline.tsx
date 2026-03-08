import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp, History, Filter } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import type { TrustStatus } from './types';

interface DiagnosticAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  description: string;
  target: string;
  domain: string | null;
  resolved: boolean;
  resolved_at: string | null;
  resolution_note: string | null;
  created_at: string;
}

const alertTypeLabels: Record<string, string> = {
  model_drift: 'Model Drift',
  data_quality: 'Data Quality',
  bias_detected: 'Bias Detected',
  blind_spot: 'Blind Spot',
  prediction_failure: 'Prediction Failure',
  confidence_decay: 'Confidence Decay',
};

const alertTypeIcons: Record<string, typeof AlertTriangle> = {
  model_drift: AlertTriangle,
  data_quality: XCircle,
  bias_detected: AlertTriangle,
  blind_spot: XCircle,
  prediction_failure: XCircle,
  confidence_decay: AlertTriangle,
};

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

type FilterType = 'all' | 'active' | 'resolved';

export function AlertHistoryTimeline() {
  const [alerts, setAlerts] = useState<DiagnosticAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  useEffect(() => {
    async function fetchAlerts() {
      const { data, error } = await supabase
        .from('diagnostic_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAlerts(data as DiagnosticAlert[]);
      }
      setLoading(false);
    }
    fetchAlerts();
  }, []);

  const filtered = alerts.filter((a) => {
    if (filter === 'active') return !a.resolved;
    if (filter === 'resolved') return a.resolved;
    return true;
  });

  const activeCount = alerts.filter((a) => !a.resolved).length;
  const resolvedCount = alerts.filter((a) => a.resolved).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-lg border border-border bg-card p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground font-mono tracking-wide">Alert History</h2>
          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">
            {activeCount} active
          </span>
          <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-trust-healthy/15 text-trust-healthy">
            {resolvedCount} resolved
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(['all', 'active', 'resolved'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs font-mono px-2 py-1 rounded transition-colors ${
                filter === f
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-xs font-mono">Loading alert history...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-xs font-mono">No alerts found.</div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />

          <div className="space-y-1">
            <AnimatePresence>
              {filtered.map((alert, i) => {
                const Icon = alertTypeIcons[alert.alert_type] || AlertTriangle;
                const isExpanded = expandedId === alert.id;
                const severity = alert.severity as TrustStatus;

                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start gap-3 pl-0 pr-2 py-2 rounded hover:bg-secondary/30 transition-colors relative">
                        {/* Timeline dot */}
                        <div
                          className={`relative z-10 mt-1 w-[9px] h-[9px] rounded-full ring-2 ring-card flex-shrink-0 ml-[11px] ${
                            alert.resolved
                              ? 'bg-trust-healthy'
                              : severity === 'degraded'
                              ? 'bg-destructive'
                              : severity === 'caution'
                              ? 'bg-primary'
                              : 'bg-trust-healthy'
                          }`}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-medium text-foreground truncate">
                              {alert.title}
                            </span>
                            {alert.resolved && (
                              <CheckCircle2 className="w-3 h-3 text-trust-healthy flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                              {alertTypeLabels[alert.alert_type] || alert.alert_type}
                            </span>
                            <StatusBadge status={severity} size="sm" />
                            {alert.domain && (
                              <span className="text-[10px] font-mono text-muted-foreground">{alert.domain}</span>
                            )}
                            <span className="text-[10px] font-mono text-muted-foreground ml-auto flex-shrink-0">
                              {formatTimeAgo(alert.created_at)}
                            </span>
                          </div>
                        </div>

                        <ChevronDown
                          className={`w-3 h-3 text-muted-foreground mt-1 flex-shrink-0 transition-transform ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden ml-[30px] mb-2"
                        >
                          <div className="p-3 rounded bg-secondary/40 border border-border text-xs font-mono space-y-2">
                            <p className="text-foreground/80">{alert.description}</p>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>Target: {alert.target}</span>
                              <span>·</span>
                              <span>{new Date(alert.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            {alert.resolved && alert.resolution_note && (
                              <div className="pt-2 border-t border-border">
                                <div className="flex items-center gap-1.5 text-trust-healthy mb-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span className="font-medium">Resolved</span>
                                  {alert.resolved_at && (
                                    <span className="text-muted-foreground">
                                      · {formatTimeAgo(alert.resolved_at)}
                                    </span>
                                  )}
                                </div>
                                <p className="text-foreground/70">{alert.resolution_note}</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      )}
    </motion.div>
  );
}
