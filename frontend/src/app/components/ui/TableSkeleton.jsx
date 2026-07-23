/**
 * TableSkeleton — Premium table loading skeleton with shimmer animation.
 */
export default function TableSkeleton({ rows = 6, columns = 6 }) {
  const shimmer =
    'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent';

  return (
    <div className="divide-y divide-surface-100 dark:divide-surface-700/50">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="px-5 py-4 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center"
          style={{ animationDelay: `${rowIdx * 0.04}s` }}
        >
          {/* Student avatar + name */}
          <div className="lg:col-span-3 flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
            <div className="flex-1 space-y-1.5">
              <div className={`h-3 w-3/4 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
              <div className={`h-2.5 w-1/2 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
            </div>
          </div>

          {/* Period */}
          <div className="hidden lg:block lg:col-span-2">
            <div className={`h-3 w-4/5 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
          </div>

          {/* Status badge */}
          <div className="lg:col-span-2">
            <div className={`h-6 w-20 rounded-lg bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
          </div>

          {/* Version */}
          <div className="hidden lg:block lg:col-span-1">
            <div className={`h-3 w-8 mx-auto rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
          </div>

          {/* Average */}
          <div className="hidden lg:block lg:col-span-1">
            <div className={`h-4 w-12 mx-auto rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
          </div>

          {/* Rank */}
          <div className="hidden lg:block lg:col-span-1">
            <div className={`h-3 w-10 mx-auto rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
          </div>

          {/* Action buttons */}
          <div className="lg:col-span-2 flex items-center justify-end gap-1.5">
            {Array.from({ length: 3 }).map((_, btnIdx) => (
              <div
                key={btnIdx}
                className={`w-7 h-7 rounded-lg bg-surface-100 dark:bg-surface-700 ${shimmer}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
