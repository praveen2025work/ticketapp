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

export type DashboardTileFilter = 'BACKLOG_AND_ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS_GROUP' | 'RESOLVED_CLOSED_ARCHIVED' | null;

/** @deprecated Use DashboardTileFilter for new dashboard tiles. */
export type StatusFilter = DashboardTileFilter;

interface MetricsCardsProps {
  metrics: {
    totalOpenTickets?: number;
    totalResolvedTickets?: number;
    totalClosedTickets?: number;
    totalArchivedTickets?: number;
    ticketsByStatus?: Record<string, number>;
    averageResolutionTimeHours: number | null;
    slaCompliancePercentage: number | null;
  };
  selectedFilter?: DashboardTileFilter;
  onFilterChange?: (filter: DashboardTileFilter) => void;
  /** When set, card clicks navigate to tickets page with this status filter. */
  onNavigateToTickets?: (status: 'BACKLOG_AND_ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS_GROUP' | 'RESOLVED_CLOSED_ARCHIVED') => void;
}

function sumStatus(byStatus: Record<string, number> | undefined, ...keys: string[]): number {
  if (!byStatus) return 0;
  return keys.reduce((s, k) => s + (byStatus[k] ?? 0), 0);
}

export default function MetricsCards({ metrics, selectedFilter = null, onFilterChange, onNavigateToTickets }: MetricsCardsProps) {
  const byStatus = metrics.ticketsByStatus ?? {};
  const totalBacklog = sumStatus(byStatus, 'BACKLOG', 'ASSIGNED');
  const totalAccepted = sumStatus(byStatus, 'ACCEPTED');
  const totalInProgressGroup = sumStatus(byStatus, 'IN_PROGRESS', 'ROOT_CAUSE_IDENTIFIED', 'FIX_IN_PROGRESS');
  const totalResolvedClosedArchived = sumStatus(byStatus, 'RESOLVED', 'CLOSED', 'ARCHIVED');

  const handleBacklogClick = () => {
    if (onNavigateToTickets) onNavigateToTickets('BACKLOG_AND_ASSIGNED');
    else onFilterChange?.(selectedFilter === 'BACKLOG_AND_ASSIGNED' ? null : 'BACKLOG_AND_ASSIGNED');
  };
  const handleAcceptedClick = () => {
    if (onNavigateToTickets) onNavigateToTickets('ACCEPTED');
    else onFilterChange?.(selectedFilter === 'ACCEPTED' ? null : 'ACCEPTED');
  };
  const handleInProgressGroupClick = () => {
    if (onNavigateToTickets) onNavigateToTickets('IN_PROGRESS_GROUP');
    else onFilterChange?.(selectedFilter === 'IN_PROGRESS_GROUP' ? null : 'IN_PROGRESS_GROUP');
  };
  const handleResolvedClosedArchivedClick = () => {
    if (onNavigateToTickets) onNavigateToTickets('RESOLVED_CLOSED_ARCHIVED');
    else onFilterChange?.(selectedFilter === 'RESOLVED_CLOSED_ARCHIVED' ? null : 'RESOLVED_CLOSED_ARCHIVED');
  };

  const hasCardClick = !!onNavigateToTickets || !!onFilterChange;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      <MetricCard
        title="Backlog"
        value={totalBacklog}
        color="amber"
        subtitle="Backlog, Assigned"
        onClick={hasCardClick ? handleBacklogClick : undefined}
        isSelected={selectedFilter === 'BACKLOG_AND_ASSIGNED'}
      />
      <MetricCard
        title="Accepted"
        value={totalAccepted}
        color="sky"
        subtitle="Accepted"
        onClick={hasCardClick ? handleAcceptedClick : undefined}
        isSelected={selectedFilter === 'ACCEPTED'}
      />
      <MetricCard
        title="In Progress"
        value={totalInProgressGroup}
        color="emerald"
        subtitle="In Progress, RCA Done, Fix In Progress"
        onClick={hasCardClick ? handleInProgressGroupClick : undefined}
        isSelected={selectedFilter === 'IN_PROGRESS_GROUP'}
      />
      <MetricCard
        title="Resolved / Closed / Archived"
        value={totalResolvedClosedArchived}
        color="green"
        subtitle="Resolved, Closed, Archived"
        onClick={hasCardClick ? handleResolvedClosedArchivedClick : undefined}
        isSelected={selectedFilter === 'RESOLVED_CLOSED_ARCHIVED'}
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
