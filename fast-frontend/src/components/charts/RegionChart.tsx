interface RegionChartProps {
  data: Record<string, number>;
}

export default function RegionChart({ data }: RegionChartProps) {
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="space-y-3">
      {Object.entries(data).map(([region, count]) => (
        <div key={region}>
          <div className="flex justify-between text-sm mb-1">
            <span>{region}</span>
            <span className="font-medium">{count}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-500 h-2 rounded-full"
              style={{ width: `${(count / total) * 100}%` }}
              role="progressbar"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${region}: ${count} tickets`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
