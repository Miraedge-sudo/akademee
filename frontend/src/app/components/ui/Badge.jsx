/**
 * Predefined status color schemes.
 */
const STATUS_SCHEMES = {
  active: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
  },
  inactive: {
    bg: 'bg-surface-100 dark:bg-surface-700',
    text: 'text-surface-600 dark:text-surface-400',
    border: 'border-surface-200 dark:border-surface-600',
    dot: 'bg-surface-400',
  },
  paid: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
  },
  partial: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  unpaid: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  pending: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
    dot: 'bg-green-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
    dot: 'bg-red-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
    dot: 'bg-blue-500',
  },
  // ── Role-based statuses ──
  teacher: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-700 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800',
    dot: 'bg-indigo-500',
  },
  admin: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
    dot: 'bg-purple-500',
  },
  accountant: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-700 dark:text-cyan-400',
    border: 'border-cyan-200 dark:border-cyan-800',
    dot: 'bg-cyan-500',
  },
};

/**
 * A badge component for displaying statuses, labels, and tags.
 *
 * @param {{
 *   status?: keyof typeof STATUS_SCHEMES,
 *   variant?: 'solid'|'outline'|'dot',
 *   children: React.ReactNode,
 *   className?: string,
 *   size?: 'sm'|'md'
 * }} props
 *
 * Usage:
 *   <Badge status="paid">Paid</Badge>
 *   <Badge variant="outline">Custom</Badge>
 *   <Badge status="active" variant="dot">Active</Badge>
 */
export default function Badge({
  status,
  variant = 'solid',
  children,
  className = '',
  size = 'sm',
}) {
  const scheme = STATUS_SCHEMES[status];

  const sizeClasses = size === 'sm'
    ? 'text-[10px] px-2 py-0.5'
    : 'text-xs px-2.5 py-1';

  // Dot variant: small dot + text
  if (variant === 'dot' && scheme) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 ${sizeClasses} rounded-full font-semibold ${scheme.text} ${className}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${scheme.dot}`} />
        {children}
      </span>
    );
  }

  // Outline variant: border only, no background
  if (variant === 'outline') {
    return (
      <span
        className={`inline-flex items-center ${sizeClasses} rounded-full font-semibold border border-current text-surface-500 dark:text-surface-400 ${className}`}
      >
        {children}
      </span>
    );
  }

  // Solid variant with status color scheme (default)
  if (scheme) {
    return (
      <span
        className={`inline-flex items-center ${sizeClasses} rounded-full font-semibold border ${scheme.bg} ${scheme.text} ${scheme.border} ${className}`}
      >
        {children}
      </span>
    );
  }

  // Fallback: minimal badge
  return (
    <span
      className={`inline-flex items-center ${sizeClasses} rounded-full font-semibold bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 border border-surface-200 dark:border-surface-600 ${className}`}
    >
      {children}
    </span>
  );
}
