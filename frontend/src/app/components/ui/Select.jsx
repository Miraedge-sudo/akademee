import { FiChevronDown } from 'react-icons/fi';

const baseSelectClass = `
  w-full h-11 px-3.5 rounded-lg border-[1.5px]
  bg-surface-50 dark:bg-surface-900
  text-surface-800 dark:text-surface-100
  text-sm outline-none appearance-none cursor-pointer
  transition-all duration-200
`;

const focusClass = `
  focus:border-primary-600 focus:bg-white dark:focus:bg-surface-800
  focus:ring-[3.5px] focus:ring-primary-600/10
`;

const errorClass = `
  border-red-300 dark:border-red-700
  focus:border-red-500 focus:ring-red-500/10
`;

/**
 * Form select dropdown.
 *
 * @param {{
 *   label?: string,
 *   error?: string|false,
 *   hint?: string,
 *   placeholder?: string,
 *   options: Array<{ value: string, label: string }>,
 *   className?: string,
 *   [key: string]: any
 * }} props
 */
export default function Select({
  label,
  error,
  hint,
  placeholder,
  options = [],
  className = '',
  value,
  ...props
}) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          value={value}
          aria-invalid={error ? 'true' : undefined}
          className={`
            ${baseSelectClass}
            ${error ? errorClass : focusClass}
            ${!value ? 'text-surface-400' : ''}
            pr-10
            ${className}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400">
          <FiChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-red-500 mt-1.5">{error}</p>
      )}

      {hint && !error && (
        <p className="text-[11px] text-surface-400 mt-1.5">{hint}</p>
      )}
    </div>
  );
}
