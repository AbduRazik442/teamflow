
export default function LoadingSkeleton({
  lines = 3,
  className = "",
}) {
  return (
    <div
      className={`animate-pulse space-y-3 ${className}`}
      role="status"
      aria-label="Loading content"
    >
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className="h-4 rounded-lg bg-slate-200 dark:bg-slate-700"
          style={{
            width: `${index === lines - 1 ? 65 : 100}%`,
          }}
        />
      ))}
      <span className="sr-only">Loading...</span>
    </div>
  );
}