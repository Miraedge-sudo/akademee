import { FiLoader } from 'react-icons/fi';

const VARIANT_CLASSES = {
  primary:
    'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
  secondary:
    'border border-surface-200 dark:border-surface-600 text-surface-600 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700',
  danger:
    'bg-red-600 hover:bg-red-700 text-white shadow-sm hover:shadow-md active:scale-[0.98]',
  ghost:
    'text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700',
  'outline-primary':
    'border border-primary-600 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 active:scale-[0.98]',
};

const SIZE_CLASSES = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-sm',
  xl: 'h-14 px-8 text-base',
};

/**
 * Versatile button component.
 *
 * @param {{
 *   variant?: 'primary'|'secondary'|'danger'|'ghost'|'outline-primary',
 *   size?: 'sm'|'md'|'lg'|'xl',
 *   loading?: boolean,
 *   disabled?: boolean,
 *   fullWidth?: boolean,
 *   icon?: React.ReactNode,
 *   children?: React.ReactNode,
 *   className?: string,
 *   [key: string]: any
 * }} props
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon,
  children,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={props.type || 'button'}
      disabled={isDisabled}
      aria-busy={loading ? 'true' : undefined}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-all duration-200 outline-none focus:ring-2 focus:ring-primary-600/30
        ${VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary}
        ${SIZE_CLASSES[size] || SIZE_CLASSES.md}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <FiLoader className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="w-4 h-4 flex-shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
    </button>
  );
}
