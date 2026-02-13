import type { FastProblem, TicketLink } from '../shared/types';
import ClassificationBadge from './ClassificationBadge';
import RagBadge from './RagBadge';
import { Link } from 'react-router-dom';

const AGING_THRESHOLD_DAYS = 20;
const RESOLVED_STATUSES = ['RESOLVED', 'CLOSED'];
const UPSTREAM_LINK_TYPES = ['JIRA', 'SERVICEFIRST'];

function formatPriority(p: number | null | undefined): string {
  if (p == null || p < 1 || p > 5) return '-';
  return String(p);
}

function upstreamLinks(ticket: FastProblem): TicketLink[] {
  if (!ticket.links?.length) return [];
  return ticket.links.filter(
    (l) => l.linkType && UPSTREAM_LINK_TYPES.includes(l.linkType.toUpperCase())
  );
}

export type GroupByOption = 'none' | 'application';

interface TicketTableProps {
  tickets: FastProblem[];
  isLoading?: boolean;
  groupBy?: GroupByOption;
  /** When true, show a column with JIRA / ServiceFirst ticket links. */
  showUpstreamLinks?: boolean;
}

function TicketTableInner({ tickets, showUpstreamLinks }: { tickets: FastProblem[]; showUpstreamLinks?: boolean }) {
  const statusColors: Record<string, string> = {
    NEW: 'bg-sky-100 text-sky-800',
    ASSIGNED: 'bg-violet-100 text-violet-800',
    IN_PROGRESS: 'bg-amber-100 text-amber-800',
    ROOT_CAUSE_IDENTIFIED: 'bg-orange-100 text-orange-800',
    FIX_IN_PROGRESS: 'bg-amber-100 text-amber-800',
    RESOLVED: 'bg-emerald-100 text-emerald-800',
    CLOSED: 'bg-slate-100 text-slate-700',
    REJECTED: 'bg-rose-100 text-rose-800',
  };

  const isAging = (ticket: FastProblem) =>
    !RESOLVED_STATUSES.includes(ticket.status) &&
    (ticket.ticketAgeDays ?? 0) >= AGING_THRESHOLD_DAYS;

  return (
    <div className="overflow-x-auto w-full min-w-0">
      <table className="w-full table-fixed divide-y divide-slate-200 dark:divide-slate-600">
        <colgroup>
          <col style={{ width: showUpstreamLinks ? '8%' : '10%' }} />
          <col style={{ width: showUpstreamLinks ? '16%' : '20%' }} />
          <col style={{ width: showUpstreamLinks ? '8%' : '10%' }} />
          <col style={{ width: '9%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '6%' }} />
          <col style={{ width: '13%' }} />
          {showUpstreamLinks && <col style={{ width: '18%' }} />}
        </colgroup>
        <thead className="bg-slate-50/80 dark:bg-slate-800/80">
          <tr>
            <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              FAST ID / INC
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Title
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Region
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider w-[7.5rem] min-w-[7.5rem]">
              Class
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider w-[9rem] min-w-[9rem]">
              RAG
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider w-[7rem] min-w-[7rem]">
              Status
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Age
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Impact
            </th>
            <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Priority
            </th>
            {showUpstreamLinks && (
              <th scope="col" className="px-6 py-3.5 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                JIRA / ServiceFirst
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-800/50 divide-y divide-slate-100 dark:divide-slate-600">
          {tickets.map((ticket) => {
            const aging = isAging(ticket);
            return (
              <tr
                key={ticket.id}
                className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/80 transition-all duration-200 ${
                  aging ? 'animate-subtle-glow bg-rose-50/60 dark:bg-rose-900/30 ring-1 ring-rose-200/60 dark:ring-rose-500/40' : ''
                }`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    to={`/tickets/${ticket.id}`}
                    className="flex items-center gap-2 group"
                  >
                    {aging && (
                      <span
                        className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0"
                        title={`Aging: ${ticket.ticketAgeDays} days unresolved`}
                        aria-label="Aging ticket - over 20 days unresolved"
                      />
                    )}
                    <div>
                      <div className="text-sm font-semibold text-primary group-hover:underline">
                        FAST-{ticket.id}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{ticket.servicenowIncidentNumber || '-'}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-6 py-4 min-w-0">
                  <div className="text-sm text-slate-900 dark:text-slate-100 truncate font-medium" title={ticket.title}>
                    {ticket.title}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{ticket.affectedApplication || '-'}</div>
                </td>
                <td className="px-6 py-4 min-w-0">
                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-full inline-block" title={ticket.regionalCodes?.length ? ticket.regionalCodes.join(', ') : undefined}>
                    {ticket.regionalCodes?.length ? ticket.regionalCodes.join(', ') : '—'}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap align-middle overflow-hidden min-w-[7.5rem]" style={{ minWidth: '7.5rem' }}>
                  <span className="inline-block max-w-full">
                    <ClassificationBadge classification={ticket.classification || 'A'} />
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap align-middle overflow-hidden min-w-[9rem]" style={{ minWidth: '9rem' }}>
                  <span className="inline-block max-w-full">
                    <RagBadge ragStatus={ticket.ragStatus ?? undefined} />
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap align-middle overflow-hidden min-w-[7rem]" style={{ minWidth: '7rem' }}>
                  <span className="inline-block max-w-full">
                    <span
                      className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-lg ${statusColors[ticket.status] || 'bg-slate-100 text-slate-700'}`}
                    >
                      {ticket.status.replace(/_/g, ' ')}
                    </span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`text-sm font-medium ${aging ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'}`}
                    title={aging ? `Over ${AGING_THRESHOLD_DAYS} days - attention needed` : undefined}
                  >
                    {ticket.ticketAgeDays ?? 0}d
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 text-center">
                  {ticket.userImpactCount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 text-center font-medium">
                  {formatPriority(ticket.priority)}
                </td>
                {showUpstreamLinks && (
                  <td className="px-6 py-4 min-w-0">
                    <div className="flex flex-col gap-1">
                      {upstreamLinks(ticket).length === 0 ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500">—</span>
                      ) : (
                        upstreamLinks(ticket).map((link) => (
                          <a
                            key={link.id}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline truncate max-w-full inline-block"
                            title={link.url}
                          >
                            {link.label || link.linkType || 'Link'}
                          </a>
                        ))
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function TicketTable({ tickets, isLoading, groupBy = 'none', showUpstreamLinks = false }: TicketTableProps) {
  if (isLoading) {
    return <div className="text-center py-8 text-slate-500 dark:text-slate-400">Loading...</div>;
  }

  if (tickets.length === 0) {
    return <div className="text-center py-8 text-slate-500 dark:text-slate-400">No tickets found</div>;
  }

  if (groupBy === 'application') {
    const grouped = tickets.reduce<Record<string, FastProblem[]>>((acc, t) => {
      const app = t.affectedApplication?.trim() || '(No application)';
      if (!acc[app]) acc[app] = [];
      acc[app].push(t);
      return acc;
    }, {});
    const sortedApps = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

    return (
      <div className="space-y-8">
        {sortedApps.map((app) => (
          <div key={app}>
            <h3 className="px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600">
              {app} <span className="text-slate-500 dark:text-slate-400 font-normal">({grouped[app].length} ticket{grouped[app].length !== 1 ? 's' : ''})</span>
            </h3>
            <TicketTableInner tickets={grouped[app]} showUpstreamLinks={showUpstreamLinks} />
          </div>
        ))}
      </div>
    );
  }

  return <TicketTableInner tickets={tickets} showUpstreamLinks={showUpstreamLinks} />;
}
