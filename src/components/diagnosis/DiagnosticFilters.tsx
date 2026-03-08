import { Search, X } from 'lucide-react';
import type { TrustStatus } from './types';

export interface FilterState {
  search: string;
  status: TrustStatus | 'all';
  domain: string;
}

interface DiagnosticFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  domains: string[];
}

const statusOptions: { value: TrustStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'healthy', label: 'Healthy' },
  { value: 'caution', label: 'Caution' },
  { value: 'degraded', label: 'Degraded' },
];

export function DiagnosticFilters({ filters, onChange, domains }: DiagnosticFiltersProps) {
  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.domain;

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      {/* Search */}
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search models, sources, regions..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="w-full pl-8 pr-3 py-1.5 text-xs font-mono bg-secondary/50 border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value as TrustStatus | 'all' })}
        className="text-xs font-mono bg-secondary/50 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
      >
        {statusOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>

      {/* Domain filter */}
      <select
        value={filters.domain}
        onChange={(e) => onChange({ ...filters, domain: e.target.value })}
        className="text-xs font-mono bg-secondary/50 border border-border rounded px-2.5 py-1.5 text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer"
      >
        <option value="">All Domains</option>
        {domains.map(d => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={() => onChange({ search: '', status: 'all', domain: '' })}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 rounded border border-border bg-secondary/30 transition-colors"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
