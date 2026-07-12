import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';

/**
 * Slide-in drawer panel from the right side.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   title?: string,
 *   subtitle?: string,
 *   children: React.ReactNode,
 *   footer?: React.ReactNode,
 *   width?: string,
 *   closeOnOverlay?: boolean,
 * }} props
 */
export default function Drawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 'max-w-lg',
  closeOnOverlay = true,
}) {
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKey);
    // Prevent body scroll when open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
        onClick={closeOnOverlay ? onClose : undefined}
      />

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full sm:${width} 
          bg-white dark:bg-surface-800 
          shadow-2xl border-l border-surface-200 dark:border-surface-700
          flex flex-col
          animate-slideInRight
          z-10
        `}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-surface-200 dark:border-surface-700">
          <div className="flex-1 min-w-0 pr-4">
            {title && (
              <h2 className="text-lg font-semibold text-surface-800 dark:text-surface-100 truncate">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-surface-500 dark:text-surface-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-md text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors flex-shrink-0"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-5 border-t border-surface-200 dark:border-surface-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
