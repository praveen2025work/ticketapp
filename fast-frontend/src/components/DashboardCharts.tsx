import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DashboardMetrics } from '../shared/types';

const CLASS_COLORS = ['#10b981', '#f59e0b', '#ef4444'];
const RAG_COLORS = ['#22c55e', '#f59e0b', '#ef4444']; // G, A, R
const REGION_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4'];

export type ChartNavigateFilters = { status?: string; region?: string; classification?: string; ragStatus?: string };

interface DashboardChartsProps {
  metrics: DashboardMetrics;
  /** When set, clicking chart segments navigates to tickets page with the clicked filter. */
  onNavigateToTickets?: (filters: ChartNavigateFilters) => void;
}

export default function DashboardCharts({ metrics, onNavigateToTickets }: DashboardChartsProps) {
  const classificationData = Object.entries(metrics.ticketsByClassification).map(([key, value]) => ({
    name: key === 'A' ? 'Approve' : key === 'R' ? 'Review' : 'Priority',
    value,
    filterKey: key,
  }));

  const regionData = Object.entries(metrics.ticketsByRegion).map(([name, value]) => ({ name, value }));

  const ragData = metrics.ticketsByRag
    ? Object.entries(metrics.ticketsByRag).map(([key, value]) => ({
        name: key === 'G' ? 'Green (≤15d)' : key === 'A' ? 'Amber (15–20d)' : 'Red (>20d)',
        shortName: key === 'G' ? 'Green' : key === 'A' ? 'Amber' : 'Red',
        value,
        filterKey: key,
      }))
    : [];

  const statusData = Object.entries(metrics.ticketsByStatus)
    .filter(([, v]) => v > 0)
    .map(([statusKey, value]) => ({ name: statusKey.replace(/_/g, ' '), value, filterKey: statusKey }));

  const resolutionData = Object.entries(metrics.avgResolutionByRegion).map(([name, value]) => ({
    name,
    hours: value > 0 ? Number(value.toFixed(1)) : 0,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Classification Distribution</h2>
        <div className="h-64 min-h-[200px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={classificationData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                onClick={
                  onNavigateToTickets
                    ? (data: { filterKey?: string }) => {
                        if (data?.filterKey) onNavigateToTickets({ classification: data.filterKey });
                      }
                    : undefined
                }
                style={onNavigateToTickets ? { cursor: 'pointer' } : undefined}
              >
                {classificationData.map((_, idx) => (
                  <Cell key={idx} fill={CLASS_COLORS[idx % CLASS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [v ?? 0, 'Tickets']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {ragData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up stagger-1">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">RAG Status (Escalation)</h2>
          <div className="h-64 min-h-[200px] min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ragData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ payload, percent, value }) =>
                    value > 0 ? `${(payload as { shortName?: string })?.shortName ?? payload?.name} ${((percent ?? 0) * 100).toFixed(0)}%` : ''
                  }
                  labelLine={{ strokeWidth: 1 }}
                  onClick={
                    onNavigateToTickets
                      ? (data: { filterKey?: string }) => {
                          if (data?.filterKey) onNavigateToTickets({ ragStatus: data.filterKey });
                        }
                      : undefined
                  }
                  style={onNavigateToTickets ? { cursor: 'pointer' } : undefined}
                >
                  {ragData.map((_, idx) => (
                    <Cell key={idx} fill={RAG_COLORS[idx % RAG_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [v ?? 0, 'Tickets']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up stagger-1">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Regional Distribution</h2>
        <div className="h-64 min-h-[200px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar
                dataKey="value"
                name="Tickets"
                radius={[4, 4, 0, 0]}
                onClick={
                  onNavigateToTickets
                    ? (data) => {
                        const region = data?.name;
                        if (region) onNavigateToTickets({ region });
                      }
                    : undefined
                }
                style={onNavigateToTickets ? { cursor: 'pointer' } : undefined}
              >
                {regionData.map((_, idx) => (
                  <Cell key={idx} fill={REGION_COLORS[idx % REGION_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up stagger-2">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Status Overview</h2>
        <div className="h-64 min-h-[200px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={55} />
              <Tooltip />
              <Bar
                dataKey="value"
                name="Count"
                fill="#6366f1"
                radius={[0, 4, 4, 0]}
                onClick={
                  onNavigateToTickets
                    ? (data) => {
                        const status = (data as { filterKey?: string })?.filterKey;
                        if (status) onNavigateToTickets({ status });
                      }
                    : undefined
                }
                style={onNavigateToTickets ? { cursor: 'pointer' } : undefined}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 animate-slide-up stagger-3">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Avg Resolution Time by Region (hours)</h2>
        <div className="h-64 min-h-[200px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={resolutionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [typeof v === 'number' && v > 0 ? `${v}h` : 'N/A', 'Hours']} />
              <Bar
                dataKey="hours"
                name="Hours"
                fill="#10b981"
                radius={[4, 4, 0, 0]}
                onClick={
                  onNavigateToTickets
                    ? (data) => {
                        const region = (data as { name?: string })?.name;
                        if (region) onNavigateToTickets({ region });
                      }
                    : undefined
                }
                style={onNavigateToTickets ? { cursor: 'pointer' } : undefined}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
