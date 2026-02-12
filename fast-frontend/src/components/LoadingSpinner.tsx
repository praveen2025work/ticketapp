interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-gray-500">
      <div
        className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary"
        role="status"
        aria-label="Loading"
      />
      {message && <p className="mt-3 text-sm">{message}</p>}
    </div>
  );
}
