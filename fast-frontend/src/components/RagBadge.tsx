import type { RagStatus } from '../shared/types';

const ragMap: Record<RagStatus, { bg: string; text: string; label: string }> = {
  G: { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-800 dark:text-emerald-200', label: 'Green (≤15d)' },
  A: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-800 dark:text-amber-200', label: 'Amber (15–20d)' },
  R: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-200', label: 'Red (>20d)' },
};

export default function RagBadge({ ragStatus }: { ragStatus: RagStatus | null | undefined }) {
  if (ragStatus == null) return null;
  const config = ragMap[ragStatus] ?? ragMap.G;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.bg} ${config.text}`}
      title={`RAG: ${config.label}`}
    >
      {ragStatus} – {config.label}
    </span>
  );
}
