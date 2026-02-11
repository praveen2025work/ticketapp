interface EmptyStateProps {
  message: string;
  className?: string;
}

export default function EmptyState({ message, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`rounded-lg bg-white p-8 text-center text-gray-500 shadow ${className}`}
      role="status"
    >
      {message}
    </div>
  );
}
