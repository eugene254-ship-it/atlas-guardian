import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ExportFormat = 'csv' | 'json';
type ExportScope = 'alerts' | 'models' | 'data_sources' | 'all';

const SCOPES: { value: ExportScope; label: string }[] = [
  { value: 'all', label: 'All Data' },
  { value: 'alerts', label: 'Alerts' },
  { value: 'models', label: 'Model Metrics' },
  { value: 'data_sources', label: 'Data Sources' },
];

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => {
      const val = row[h];
      const str = val === null || val === undefined ? '' : String(val);
      return str.includes(',') || str.includes('"') || str.includes('\n')
        ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(','));
  }
  return lines.join('\n');
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function DataExportPanel() {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [scope, setScope] = useState<ExportScope>('all');
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const result: Record<string, unknown[]> = {};
      const timestamp = new Date().toISOString().split('T')[0];

      if (scope === 'alerts' || scope === 'all') {
        const { data } = await supabase.from('diagnostic_alerts').select('*').order('created_at', { ascending: false });
        result.alerts = data || [];
      }
      if (scope === 'models' || scope === 'all') {
        const { data } = await supabase.from('model_metrics').select('*').order('recorded_at', { ascending: false });
        result.model_metrics = data || [];
      }
      if (scope === 'data_sources' || scope === 'all') {
        const { data } = await supabase.from('data_source_health').select('*').order('recorded_at', { ascending: false });
        result.data_source_health = data || [];
      }

      if (format === 'json') {
        const content = JSON.stringify(result, null, 2);
        downloadFile(content, `atlas-diagnostic-${scope}-${timestamp}.json`, 'application/json');
      } else {
        // CSV: export each table as separate file or combined
        for (const [table, rows] of Object.entries(result)) {
          if (rows.length > 0) {
            const csv = toCsv(rows as Record<string, unknown>[]);
            downloadFile(csv, `atlas-${table}-${timestamp}.csv`, 'text/csv');
          }
        }
      }

      toast.success(`Exported ${scope === 'all' ? 'all diagnostic data' : scope} as ${format.toUpperCase()}`);
    } catch {
      toast.error('Export failed');
    }
    setExporting(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md border border-border bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            className="absolute right-0 top-full mt-1 z-30 w-64 rounded-lg border border-border bg-card p-3 shadow-xl"
          >
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mb-2">Export Diagnostic Data</p>

            {/* Scope */}
            <div className="space-y-1 mb-3">
              <p className="text-[10px] font-mono text-muted-foreground">Scope</p>
              <div className="grid grid-cols-2 gap-1">
                {SCOPES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => setScope(s.value)}
                    className={`text-[10px] font-mono px-2 py-1.5 rounded border transition-colors ${
                      scope === s.value
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div className="space-y-1 mb-3">
              <p className="text-[10px] font-mono text-muted-foreground">Format</p>
              <div className="flex gap-1">
                <button
                  onClick={() => setFormat('csv')}
                  className={`flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded border transition-colors flex-1 ${
                    format === 'csv'
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  CSV
                </button>
                <button
                  onClick={() => setFormat('json')}
                  className={`flex items-center gap-1.5 text-[10px] font-mono px-3 py-1.5 rounded border transition-colors flex-1 ${
                    format === 'json'
                      ? 'border-primary/50 bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <FileJson className="w-3 h-3" />
                  JSON
                </button>
              </div>
            </div>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-1.5 text-xs font-mono px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              {exporting ? 'Exporting...' : 'Download'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
