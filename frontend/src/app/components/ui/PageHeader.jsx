/**
 * Standardized page header with icon, title, subtitle, and optional actions.
 *
 * @param {{
 *   icon?: React.ReactNode|string,
 *   title: string,
 *   subtitle?: string,
 *   actions?: React.ReactNode,
 *   color?: string,
 *   className?: string,
 * }} props
 */
export default function PageHeader({
  icon,
  title,
  subtitle,
  actions,
  color = '#085041',
  className = '',
}) {
  return (
    <div className={`flex items-start justify-between flex-wrap gap-4 mb-7 animate-fadeIn ${className}`}>
      <div className="flex items-center gap-4">
        {icon && (
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 shadow-sm"
            style={{
              backgroundColor: `${color}14`,
              border: `1.5px solid ${color}30`,
              color,
            }}
          >
            {typeof icon === 'string' ? (
              <span>{icon}</span>
            ) : (
              icon
            )}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            {color && (
              <div
                className="w-1 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
            )}
            <h1 className="font-display text-2xl font-bold text-surface-800 dark:text-surface-100">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-sm text-surface-400 ml-3.5">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2.5">{actions}</div>
      )}
    </div>
  );
}
