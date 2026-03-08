import type { TrustStatus } from './types';
import { cn } from '@/lib/utils';

const statusConfig: Record<TrustStatus, { label: string; className: string; dotClass: string }> = {
  healthy: { label: 'Healthy', className: 'bg-trust-healthy/10 text-trust-healthy border-trust-healthy/30', dotClass: 'bg-trust-healthy' },
  caution: { label: 'Caution', className: 'bg-trust-caution/10 text-trust-caution border-trust-caution/30', dotClass: 'bg-trust-caution' },
  degraded: { label: 'Degraded', className: 'bg-trust-degraded/10 text-trust-degraded border-trust-degraded/30', dotClass: 'bg-trust-degraded' },
};

export function StatusBadge({ status, className }: { status: TrustStatus; className?: string }) {
  const config = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border', config.className, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dotClass, status === 'degraded' && 'animate-pulse-glow')} />
      {config.label}
    </span>
  );
}
