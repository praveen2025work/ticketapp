interface ClassificationChartProps {
  data: Record<string, number>;
}

const COLORS: Record<string, string> = { A: 'bg-green-500', R: 'bg-yellow-500', P: 'bg-red-500' };
const LABELS: Record<string, string> = { A: 'Approve', R: 'Review', P: 'Priority' };

export default function ClassificationChart({ data }: ClassificationChartProps) {
  const total = Object.values(data).reduce((a, b) => a + b, 0) || 1;
  return (
    <div className="space-y-3">
      {Object.entries(data).map(([cls, count]) => (
        <div key={cls}>
          <div className="flex justify-between text-sm mb-1">
            <span>{cls} - {LABELS[cls] ?? cls}</span>
            <span className="font-medium">{count}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`${COLORS[cls] ?? 'bg-gray-400'} h-2 rounded-full`}
              style={{ width: `${(count / total) * 100}%` }}
              role="progressbar"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label={`${cls} - ${LABELS[cls] ?? cls}: ${count} tickets`}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
