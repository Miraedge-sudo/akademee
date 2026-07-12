import { useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

const baseInputClass = `
  w-full h-11 px-3.5 rounded-lg border-[1.5px]
  bg-surface-50 dark:bg-surface-900
  text-surface-800 dark:text-surface-100
  placeholder:text-surface-400
  text-sm outline-none
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

const disabledClass = `
  opacity-60 cursor-not-allowed
`;

/**
 * Form input with label, icon, error message, and password toggle.
 *
 * @param {{
 *   label?: string,
 *   error?: string|false,
 *   hint?: string,
 *   icon?: React.ReactNode,
 *   type?: string,
 *   fullWidth?: boolean,
 *   className?: string,
 *   containerClassName?: string,
 *   [key: string]: any
 * }} props
 */
export default function Input({
  label,
  error,
  hint,
  icon,
  type = 'text',
  className = '',
  containerClassName = '',
  disabled,
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className={`${containerClassName}`}>
      {label && (
        <label className="block text-xs font-semibold text-surface-600 dark:text-surface-300 mb-1.5">
          {label}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 pointer-events-none">
            <span className="w-4 h-4 flex items-center justify-center">{icon}</span>
          </div>
        )}

        <input
          type={inputType}
          disabled={disabled}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error || hint ? `${props.name || 'input'}-feedback` : undefined}
          className={`
            ${baseInputClass}
            ${error ? errorClass : focusClass}
            ${disabled ? disabledClass : ''}
            ${icon ? 'pl-10' : ''}
            ${isPassword ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
          >
            {showPassword ? (
              <FiEyeOff className="w-4 h-4" />
            ) : (
              <FiEye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {error && (
        <p id={`${props.name || 'input'}-feedback`} className="text-[11px] text-red-500 mt-1.5">
          {error}
        </p>
      )}

      {hint && !error && (
        <p id={`${props.name || 'input'}-feedback`} className="text-[11px] text-surface-400 mt-1.5">
          {hint}
        </p>
      )}
    </div>
  );
}
