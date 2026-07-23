/**
 * GradeEntrySkeleton — Premium skeleton for the grade entry page with selectors and table.
 */
export default function GradeEntrySkeleton() {
  const shimmer =
    'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent';

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* ── Header skeleton ── */}
      <div className="rounded-2xl p-6 sm:p-8 bg-surface-50 dark:bg-surface-800 border border-surface-100 dark:border-surface-700">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
          <div className="space-y-2">
            <div className={`h-5 w-48 rounded-lg bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
            <div className={`h-3 w-36 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
          </div>
        </div>
      </div>

      {/* ── Selector bar ── */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className={`h-2.5 w-16 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
              <div className={`h-10 w-full rounded-xl bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Table skeleton ── */}
      <div className="bg-white dark:bg-surface-800 rounded-2xl border-[1.5px] border-surface-100 dark:border-surface-700 overflow-hidden">
        {/* Header row */}
        <div className="px-5 py-3 bg-surface-50 dark:bg-surface-900/50 border-b border-surface-100 dark:border-surface-700">
          <div className="flex gap-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className={`h-3 flex-1 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
            ))}
          </div>
        </div>

        {/* Data rows */}
        {Array.from({ length: 6 }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="px-5 py-3.5 border-b border-surface-50 dark:border-surface-700/50 last:border-0"
          >
            <div className="flex gap-4 items-center">
              <div className={`w-7 h-7 rounded-full bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
              <div className={`h-3 flex-[2] rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
              <div className={`h-3 flex-1 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
              <div className={`h-3 flex-1 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
              <div className={`h-3 flex-1 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Save button ── */}
      <div className="flex justify-end">
        <div className={`h-10 w-32 rounded-xl bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
      </div>
    </div>
  );
}
