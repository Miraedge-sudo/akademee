import { FiPlus } from 'react-icons/fi';

/**
 * Empty state placeholder with icon, title, description, and optional action button.
 *
 * Accepts either:
 * - A React element to render directly as the action
 * - An object `{ label, onClick, icon? }` to render a built-in button
 *
 * @param {{
 *   icon: React.ReactNode|string,
 *   title: string,
 *   subtitle?: string,
 *   action?: React.ReactNode | { label: string, onClick: () => void, icon?: React.ReactNode },
 *   className?: string
 * }} props
 */
export default function EmptyState({
  icon,
  title,
  subtitle,
  action,
  className = '',
}) {
  // Support both object-format ({ label, onClick }) and React-element format
  const hasOnClick = action && typeof action.onClick === 'function';

  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center ${className}`}>
      <div className="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mb-4">
        {typeof icon === 'string' ? (
          <span className="text-3xl">{icon}</span>
        ) : (
          <div className="text-surface-400">{icon}</div>
        )}
      </div>
      <h3 className="text-lg font-medium text-surface-700 dark:text-surface-200 mb-2">
        {title}
      </h3>
      {subtitle && (
        <p className="text-sm text-surface-400 max-w-md mb-5">{subtitle}</p>
      )}
      {action && (
        hasOnClick ? (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-2 h-11 px-5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-all hover:shadow-lg active:scale-[0.98]"
          >
            {action.icon || <FiPlus className="w-4 h-4" />}
            {action.label}
          </button>
        ) : (
          // React element — render directly
          action
        )
      )}
    </div>
  );
}
