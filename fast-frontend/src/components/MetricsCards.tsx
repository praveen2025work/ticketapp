interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  onClick?: () => void;
  isSelected?: boolean;
}

function MetricCard({ title, value, subtitle, color = 'emerald', onClick, isSelected }: MetricCardProps) {
  const colorMap: Record<string, { bg: string; border: string; value: string }> = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-500', value: 'text-emerald-700' },
    green: { bg: 'bg-green-50', border: 'border-green-500', value: 'text-green-700' },
    rose: { bg: 'bg-rose-50', border: 'border-rose-500', value: 'text-rose-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-500', value: 'text-amber-700' },
    sky: { bg: 'bg-sky-50', border: 'border-sky-500', value: 'text-sky-700' },
  };

  const theme = colorMap[color] || colorMap.emerald;

  const baseClasses = `rounded-2xl border-l-4 p-5 shadow-sm transition-all duration-200 ${theme.bg} ${theme.border}`;
  const interactiveClasses = onClick ? 'cursor-pointer hover:scale-[1.02] hover:shadow-lg active:scale-[0.99]' : '';
  const selectedClasses = isSelected ? 'ring-2 ring-emerald-500 ring-offset-2 shadow-lg scale-[1.02]' : '';

  return (
    <div
      className={`${baseClasses} ${interactiveClasses} ${selectedClasses}`}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className={`text-4xl font-extrabold mt-2 tabular-nums tracking-tight ${theme.value}`}>{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-2 font-medium">{subtitle}</p>}
    </div>
  );
}

export type StatusFilter = 'OPEN' | 'RESOLVED' | 'CLOSED' | null;

interface MetricsCardsProps {
  metrics: {
    totalOpenTickets: number;
    totalResolvedTickets: number;
    totalClosedTickets: number;
    averageResolutionTimeHours: number | null;
    slaCompliancePercentage: number | null;
  };
  selectedFilter?: StatusFilter;
  onFilterChange?: (filter: StatusFilter) => void;
}

export default function MetricsCards({ metrics, selectedFilter = null, onFilterChange }: MetricsCardsProps) {
  const handleOpenClick = () => onFilterChange?.(selectedFilter === 'OPEN' ? null : 'OPEN');
  const handleResolvedClick = () => onFilterChange?.(selectedFilter === 'RESOLVED' ? null : 'RESOLVED');
  const handleClosedClick = () => onFilterChange?.(selectedFilter === 'CLOSED' ? null : 'CLOSED');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <MetricCard
        title="Open Tickets"
        value={metrics.totalOpenTickets}
        color="amber"
        subtitle="Active problems"
        onClick={onFilterChange ? handleOpenClick : undefined}
        isSelected={selectedFilter === 'OPEN'}
      />
      <MetricCard
        title="Resolved"
        value={metrics.totalResolvedTickets}
        color="green"
        subtitle="Awaiting closure"
        onClick={onFilterChange ? handleResolvedClick : undefined}
        isSelected={selectedFilter === 'RESOLVED'}
      />
      <MetricCard
        title="Closed"
        value={metrics.totalClosedTickets}
        color="sky"
        subtitle="Completed"
        onClick={onFilterChange ? handleClosedClick : undefined}
        isSelected={selectedFilter === 'CLOSED'}
      />
      <MetricCard
        title="Avg Resolution"
        value={metrics.averageResolutionTimeHours ? `${metrics.averageResolutionTimeHours.toFixed(1)}h` : 'N/A'}
        color="emerald"
        subtitle="Target: 4h"
      />
      <MetricCard
        title="SLA Compliance"
        value={metrics.slaCompliancePercentage ? `${metrics.slaCompliancePercentage.toFixed(1)}%` : 'N/A'}
        color={metrics.slaCompliancePercentage && metrics.slaCompliancePercentage >= 80 ? 'green' : 'rose'}
        subtitle="Target: 80%"
      />
    </div>
  );
}
