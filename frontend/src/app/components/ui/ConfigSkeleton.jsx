/**
 * ConfigSkeleton — Premium skeleton for configuration forms/panels.
 */
export default function ConfigSkeleton() {
  const shimmer =
    'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent';

  return (
    <div className="space-y-5">
      {/* ── Tabs skeleton ── */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`h-9 w-28 rounded-xl bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
        ))}
      </div>

      {/* ── Section header ── */}
      <div className="space-y-2 mb-6">
        <div className={`h-6 w-48 rounded-lg bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
        <div className={`h-3 w-72 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
      </div>

      {/* ── Form rows ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="space-y-2">
            <div className={`h-3 w-24 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
            <div className={`h-10 w-full rounded-xl bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
          </div>
        ))}
      </div>

      {/* ── Button row ── */}
      <div className="flex justify-end gap-3 pt-2">
        <div className={`h-9 w-24 rounded-xl bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
        <div className={`h-9 w-28 rounded-xl bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
      </div>

      {/* ── Table section ── */}
      <div className="mt-8 space-y-3">
        <div className={`h-5 w-36 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className={`h-4 flex-1 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
            <div className={`h-4 w-20 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
            <div className={`h-4 w-16 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
