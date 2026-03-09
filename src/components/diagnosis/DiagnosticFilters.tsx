import { Search, X, Filter, ChevronDown } from 'lucide-react';
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

const statusOptions: { value: TrustStatus | 'all'; label: string; color?: string }[] = [
  { value: 'all', label: 'All Status' },
  { value: 'healthy', label: 'Healthy', color: 'bg-trust-healthy' },
  { value: 'caution', label: 'Caution', color: 'bg-trust-caution' },
  { value: 'degraded', label: 'Degraded', color: 'bg-trust-degraded' },
];

export function DiagnosticFilters({ filters, onChange, domains }: DiagnosticFiltersProps) {
  const hasActiveFilters = filters.search || filters.status !== 'all' || filters.domain;
  const activeCount = [filters.search, filters.status !== 'all', filters.domain].filter(Boolean).length;

  return (
    <div className="rounded-lg border border-border bg-card/50 p-3">
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Filter icon indicator */}
        <div className="flex items-center gap-2 sm:hidden mb-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-mono text-muted-foreground">Filters</span>
          {activeCount > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
              {activeCount} active
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search models, sources, regions..."
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-secondary/50 border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="relative">
          <select
            value={filters.status}
            onChange={(e) => onChange({ ...filters, status: e.target.value as TrustStatus | 'all' })}
            className="w-full sm:w-auto text-xs font-mono bg-secondary/50 border border-border rounded-md pl-3 pr-8 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer transition-colors"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        </div>

        {/* Domain filter */}
        <div className="relative">
          <select
            value={filters.domain}
            onChange={(e) => onChange({ ...filters, domain: e.target.value })}
            className="w-full sm:w-auto text-xs font-mono bg-secondary/50 border border-border rounded-md pl-3 pr-8 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none cursor-pointer transition-colors"
          >
            <option value="">All Domains</option>
            {domains.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        </div>

        {/* Clear button */}
        {hasActiveFilters && (
          <button
            onClick={() => onChange({ search: '', status: 'all', domain: '' })}
            className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-2 rounded-md border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
          >
            <X className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        )}
      </div>

      {/* Active filter pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border">
          {filters.search && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-foreground">
              Search: "{filters.search}"
              <button onClick={() => onChange({ ...filters, search: '' })} className="hover:text-destructive">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {filters.status !== 'all' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-foreground">
              <span className={`w-1.5 h-1.5 rounded-full ${statusOptions.find(s => s.value === filters.status)?.color}`} />
              {filters.status}
              <button onClick={() => onChange({ ...filters, status: 'all' })} className="hover:text-destructive">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
          {filters.domain && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-secondary text-foreground">
              Domain: {filters.domain}
              <button onClick={() => onChange({ ...filters, domain: '' })} className="hover:text-destructive">
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
