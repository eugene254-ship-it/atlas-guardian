import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, X } from 'lucide-react';

const ALERT_TYPES = [
  { key: 'model_drift', label: 'Model Drift' },
  { key: 'data_quality', label: 'Data Quality' },
  { key: 'bias_detected', label: 'Bias Detected' },
  { key: 'blind_spot', label: 'Blind Spot' },
  { key: 'prediction_failure', label: 'Prediction Failure' },
  { key: 'confidence_decay', label: 'Confidence Decay' },
];

const SEVERITY_LEVELS = [
  { key: 'degraded', label: 'Degraded', color: 'bg-trust-degraded' },
  { key: 'caution', label: 'Caution', color: 'bg-trust-caution' },
  { key: 'healthy', label: 'Healthy', color: 'bg-trust-healthy' },
];

const STORAGE_KEY = 'atlas-notification-prefs';

export interface NotificationPrefs {
  enabled: boolean;
  alertTypes: Record<string, boolean>;
  severityLevels: Record<string, boolean>;
}

export function getNotificationPrefs(): NotificationPrefs {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {
    enabled: true,
    alertTypes: Object.fromEntries(ALERT_TYPES.map(t => [t.key, true])),
    severityLevels: { degraded: true, caution: true, healthy: false },
  };
}

function savePrefs(prefs: NotificationPrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function shouldNotify(alertType: string, severity: string): boolean {
  const prefs = getNotificationPrefs();
  if (!prefs.enabled) return false;
  if (!prefs.alertTypes[alertType]) return false;
  if (!prefs.severityLevels[severity]) return false;
  return true;
}

export function NotificationPreferences() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(getNotificationPrefs);

  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  const enabledTypeCount = Object.values(prefs.alertTypes).filter(Boolean).length;
  const enabledSeverityCount = Object.values(prefs.severityLevels).filter(Boolean).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md border transition-colors ${
          prefs.enabled
            ? 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
            : 'border-destructive/30 bg-destructive/5 text-destructive'
        }`}
      >
        {prefs.enabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
        Notifications
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              className="absolute right-0 top-full mt-1 z-30 w-72 rounded-lg border border-border bg-card p-4 shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-mono font-medium text-foreground">Notification Settings</p>
                <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Master toggle */}
              <button
                onClick={() => setPrefs(p => ({ ...p, enabled: !p.enabled }))}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md border mb-3 text-xs font-mono transition-colors ${
                  prefs.enabled
                    ? 'border-trust-healthy/30 bg-trust-healthy/5 text-trust-healthy'
                    : 'border-destructive/30 bg-destructive/5 text-destructive'
                }`}
              >
                <span>{prefs.enabled ? 'Notifications Enabled' : 'Notifications Disabled'}</span>
                <div className={`w-8 h-4 rounded-full relative transition-colors ${prefs.enabled ? 'bg-trust-healthy/30' : 'bg-destructive/30'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
                    prefs.enabled ? 'right-0.5 bg-trust-healthy' : 'left-0.5 bg-destructive'
                  }`} />
                </div>
              </button>

              {prefs.enabled && (
                <>
                  {/* Severity levels */}
                  <div className="mb-3">
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">
                      Severity ({enabledSeverityCount}/{SEVERITY_LEVELS.length})
                    </p>
                    <div className="space-y-1">
                      {SEVERITY_LEVELS.map(s => (
                        <button
                          key={s.key}
                          onClick={() => setPrefs(p => ({
                            ...p,
                            severityLevels: { ...p.severityLevels, [s.key]: !p.severityLevels[s.key] }
                          }))}
                          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px] font-mono transition-colors ${
                            prefs.severityLevels[s.key]
                              ? 'bg-secondary text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${s.color}`} />
                          <span className="flex-1 text-left">{s.label}</span>
                          {prefs.severityLevels[s.key] && (
                            <span className="text-[9px] text-trust-healthy">ON</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Alert types */}
                  <div>
                    <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-1.5">
                      Alert Types ({enabledTypeCount}/{ALERT_TYPES.length})
                    </p>
                    <div className="space-y-1">
                      {ALERT_TYPES.map(t => (
                        <button
                          key={t.key}
                          onClick={() => setPrefs(p => ({
                            ...p,
                            alertTypes: { ...p.alertTypes, [t.key]: !p.alertTypes[t.key] }
                          }))}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] font-mono transition-colors ${
                            prefs.alertTypes[t.key]
                              ? 'bg-secondary text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <span>{t.label}</span>
                          {prefs.alertTypes[t.key] && (
                            <span className="text-[9px] text-trust-healthy">ON</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
