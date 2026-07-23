/**
 * StatsSkeleton — Premium stats card skeleton grid with shimmer animation.
 */
export default function StatsSkeleton({ count = 4 }) {
  const shimmer =
    'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_ease-in-out_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-surface-800 rounded-xl border-[1.5px] border-surface-100 dark:border-surface-700 p-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-[10px] bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
            <div className="flex-1 space-y-1.5">
              <div className={`h-5 w-10 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
              <div className={`h-2.5 w-16 rounded bg-surface-100 dark:bg-surface-700 ${shimmer}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
