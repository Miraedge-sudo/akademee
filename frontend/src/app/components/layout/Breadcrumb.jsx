import { Link } from 'react-router-dom';
import { FiChevronRight, FiHome } from 'react-icons/fi';

/**
 * Breadcrumb navigation component.
 *
 * @param {{
 *   items: Array<{ label: string, href?: string }>,
 *   homeIcon?: boolean,
 *   className?: string,
 * }} props
 *
 * Usage:
 *   <Breadcrumb items={[
 *     { label: 'Classes', href: '/dashboard/classes' },
 *     { label: 'Form 3A' },
 *   ]} />
 */
export default function Breadcrumb({
  items = [],
  homeIcon = true,
  className = '',
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-2 text-sm text-surface-400 mb-5 animate-fadeIn ${className}`}>
      {homeIcon && (
        <>
          <Link
            to="/dashboard"
            className="hover:text-primary-600 transition-colors flex items-center"
          >
            <FiHome className="w-3.5 h-3.5" />
          </Link>
          <FiChevronRight className="w-3 h-3 text-surface-300" />
        </>
      )}

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <span key={idx} className="flex items-center gap-2">
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-primary-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={
                  isLast
                    ? 'text-surface-800 dark:text-surface-100 font-medium'
                    : 'text-surface-400'
                }
              >
                {item.label}
              </span>
            )}
            {!isLast && <FiChevronRight className="w-3 h-3 text-surface-300" />}
          </span>
        );
      })}
    </nav>
  );
}
