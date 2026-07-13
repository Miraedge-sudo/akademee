import { FiLoader } from 'react-icons/fi';

const SIZE_MAP = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

const COLOR_MAP = {
  primary: 'text-primary-600',
  white: 'text-white',
  muted: 'text-surface-400',
  danger: 'text-red-500',
};

/**
 * Loading spinner with size and color variants.
 *
 * @param {{ size?: 'sm'|'md'|'lg'|'xl', color?: 'primary'|'white'|'muted'|'danger', className?: string, label?: string }} props
 */
export default function Spinner({
  size = 'md',
  color = 'primary',
  className = '',
  label,
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-center justify-center gap-2 ${className}`}
    >
      <FiLoader
        className={`animate-spin ${SIZE_MAP[size] || SIZE_MAP.md} ${COLOR_MAP[color] || COLOR_MAP.primary}`}
      />
      {label && (
        <span className="text-sm text-surface-500 dark:text-surface-400">
          {label}
        </span>
      )}
      <span className="sr-only">{label || 'Loading...'}</span>
    </div>
  );
}
