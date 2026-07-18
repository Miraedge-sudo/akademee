import { FiAlertTriangle, FiTrash2, FiX } from "react-icons/fi";
import Modal from "./Modal";
import Spinner from "./Spinner";

/**
 * ConfirmDialog — Replaces window.confirm() with a polished modal dialog.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onConfirm: () => void | Promise<void>,
 *   title?: string,
 *   message: string,
 *   confirmLabel?: string,
 *   cancelLabel?: string,
 *   variant?: 'danger' | 'warning' | 'info',
 *   loading?: boolean,
 *   icon?: React.ReactNode,
 * }} props
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  loading = false,
  icon,
}) {
  const variantStyles = {
    danger: {
      iconBg: "bg-red-100 dark:bg-red-900/30",
      iconColor: "text-red-600 dark:text-red-400",
      buttonBg: "bg-red-600 hover:bg-red-700 active:bg-red-800",
      border: "border-red-200 dark:border-red-800",
    },
    warning: {
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      buttonBg: "bg-amber-600 hover:bg-amber-700 active:bg-amber-800",
      border: "border-amber-200 dark:border-amber-800",
    },
    info: {
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
      buttonBg: "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
      border: "border-blue-200 dark:border-blue-800",
    },
  };

  const vs = variantStyles[variant] || variantStyles.danger;

  const DefaultIcon = variant === "danger" ? FiTrash2 : FiAlertTriangle;

  const handleConfirm = async () => {
    if (loading) return;
    await onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      size="sm"
      showCloseButton={!loading}
    >
      <div className="flex flex-col items-center text-center py-2">
        {/* Icon */}
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${vs.iconBg} ${vs.iconColor}`}
        >
          {icon || <DefaultIcon className="w-6 h-6" />}
        </div>

        {/* Title */}
        {title && (
          <h3 className="text-lg font-bold text-surface-800 dark:text-surface-100 mb-2">
            {title}
          </h3>
        )}

        {/* Message */}
        <p className="text-sm text-surface-500 dark:text-surface-400 max-w-xs leading-relaxed">
          {message}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="flex-1 h-11 rounded-xl border-2 border-surface-200 dark:border-surface-600 text-sm font-semibold text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all disabled:opacity-50"
        >
          {cancelLabel || "Cancel"}
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className={`flex-1 h-11 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${vs.buttonBg}`}
        >
          {loading ? (
            <>
              <Spinner size="sm" color="white" />
              <span>Deleting...</span>
            </>
          ) : (
            confirmLabel || "Delete"
          )}
        </button>
      </div>
    </Modal>
  );
}
