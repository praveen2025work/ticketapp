import type { Classification } from '../shared/types';

const classMap: Record<Classification, { bg: string; text: string; label: string }> = {
  A: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approve' },
  R: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Review' },
  P: { bg: 'bg-red-100', text: 'text-red-800', label: 'Priority' },
};

export default function ClassificationBadge({ classification }: { classification: Classification }) {
  const config = classMap[classification] || classMap.A;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      {classification} - {config.label}
    </span>
  );
}
