import { hexToRgba } from '../utils/colors';

/**
 * Statistic card — unified version of the StatCard patterns found in DashboardPage and ClassesChildrenSection.
 *
 * @param {{
 *   icon: React.ReactNode|string,
 *   value: string|number,
 *   label: string,
 *   color?: string,
 *   trend?: { value: number, positive: boolean },
 *   variant?: 'default'|'mini',
 *   className?: string,
 *   style?: object
 * }} props
 */
export default function StatCard({
  icon,
  value,
  label,
  color = '#085041',
  trend,
  variant = 'default',
  className = '',
  style,
}) {
  const isMini = variant === 'mini';

  if (isMini) {
    return (
      <div
        className="bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-700 rounded-lg p-3 hover:-translate-y-0.5 hover:shadow-sm transition-all"
        style={style}
      >
        <div className="text-lg mb-1">{icon}</div>
        <div
          className="text-xl font-extrabold text-surface-900 dark:text-surface-100 leading-tight mb-0.5"
          style={{ color }}
        >
          {value}
        </div>
        <div className="text-[11px] text-surface-400 font-medium">{label}</div>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
      style={style}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-surface-600 dark:text-surface-400 mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-surface-800 dark:text-surface-100">
            {value}
          </p>
          {trend && (
            <p
              className={`text-xs mt-2 ${
                trend.positive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {trend.positive ? '+' : ''}
              {trend.value}% vs last month
            </p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{
            backgroundColor: hexToRgba(color, 0.12),
            color,
          }}
        >
          {typeof icon === 'string' ? (
            <span className="text-xl">{icon}</span>
          ) : (
            icon
          )}
        </div>
      </div>
    </div>
  );
}
