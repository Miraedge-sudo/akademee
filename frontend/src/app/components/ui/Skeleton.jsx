/**
 * Skeleton loading placeholders — animated pulse variants.
 *
 * @param {{
 *   variant?: 'card'|'table'|'text'|'circle'|'custom',
 *   rows?: number,
 *   className?: string,
 *   width?: string,
 *   height?: string,
 *   count?: number,
 * }} props
 */
export default function Skeleton({
  variant = 'text',
  rows = 1,
  className = '',
  width,
  height,
  count = 1,
}) {
  const base = 'animate-pulse bg-surface-100 dark:bg-surface-700';

  const variants = {
    card: (
      <div className={`${base} rounded-xl p-5 ${className}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-surface-200 dark:bg-surface-600" />
          <div className="w-16 h-5 rounded-full bg-surface-200 dark:bg-surface-600" />
        </div>
        <div className="h-4 w-3/4 bg-surface-200 dark:bg-surface-600 rounded mb-2" />
        <div className="h-3 w-1/2 bg-surface-200 dark:bg-surface-600 rounded mb-4" />
        <div className="h-2 w-full bg-surface-200 dark:bg-surface-600 rounded-full mb-3" />
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-surface-200 dark:bg-surface-600" />
          <div className="h-3 w-20 bg-surface-200 dark:bg-surface-600 rounded" />
        </div>
      </div>
    ),
    table: (
      <div className={`space-y-3 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className={`${base} h-4 rounded flex-1`} style={{ width: `${[45, 65, 35, 55, 40][i % 5]}%` }} />
            <div className={`${base} h-4 rounded flex-1`} />
            <div className={`${base} h-4 rounded w-20`} />
          </div>
        ))}
      </div>
    ),
    text: (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={`${base} h-3 rounded`}
            style={{
              width: i === rows - 1 ? '60%' : width || '100%',
              height: height || undefined,
            }}
          />
        ))}
      </div>
    ),
    circle: (
      <div
        className={`${base} rounded-full ${className}`}
        style={{
          width: width || '48px',
          height: height || '48px',
        }}
      />
    ),
  };

  if (count > 1) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i}>{variants[variant] || variants.text}</div>
        ))}
      </div>
    );
  }

  return variants[variant] || variants.text;
}
