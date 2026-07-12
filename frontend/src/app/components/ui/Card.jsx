/**
 * Versatile card container with variants.
 *
 * @param {{
 *   variant?: 'default'|'hover'|'flat'|'interactive',
 *   padding?: 'none'|'sm'|'md'|'lg',
 *   children: React.ReactNode,
 *   className?: string,
 *   onClick?: () => void,
 *   style?: object,
 *   [key: string]: any
 * }} props
 */
export default function Card({
  variant = 'default',
  padding = 'md',
  children,
  className = '',
  onClick,
  style,
  ...props
}) {
  const variantClasses = {
    default:
      'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm',
    hover:
      'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
    flat:
      'bg-surface-50 dark:bg-surface-900 border border-surface-100 dark:border-surface-700',
    interactive:
      'bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm cursor-pointer hover:border-primary-400 hover:shadow-sm transition-all duration-200',
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      onClick={onClick}
      className={`
        rounded-xl
        ${variantClasses[variant] || variantClasses.default}
        ${paddingClasses[padding] || paddingClasses.md}
        ${onClick ? 'text-left w-full' : ''}
        ${className}
      `}
      style={style}
      {...props}
    >
      {children}
    </Tag>
  );
}
