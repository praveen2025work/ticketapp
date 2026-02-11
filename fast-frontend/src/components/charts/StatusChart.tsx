interface StatusChartProps {
  data: Record<string, number>;
}

export default function StatusChart({ data }: StatusChartProps) {
  const entries = Object.entries(data).filter(([, count]) => count > 0);
  return (
    <div className="grid grid-cols-2 gap-2">
      {entries.map(([status, count]) => (
        <div
          key={status}
          className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
          role="listitem"
        >
          <span className="text-gray-600">{status.replace(/_/g, ' ')}</span>
          <span className="font-bold text-gray-900">{count}</span>
        </div>
      ))}
    </div>
  );
}
