/**
 * Centralized Error Handler
 *
 * Extracts human-readable error messages from API responses,
 * with i18n support and context-aware fallback messages.
 */

/**
 * Extract a human-readable error message from an Axios error.
 *
 * Priority:
 * 1. Server-provided message (err.response?.data?.message)
 * 2. Context-specific fallback (contextMsg)
 * 3. Network error description
 * 4. Generic fallback
 */
export function getErrorMessage(err, contextMsg = null) {
  if (!err) return contextMsg || "An unexpected error occurred.";

  // Server-provided message — already human-readable from our backend middleware
  const serverMsg = err.response?.data?.message;
  if (serverMsg && typeof serverMsg === "string" && serverMsg.length > 0) {
    return serverMsg;
  }

  // Network / timeout errors
  if (err.code === "ERR_NETWORK") {
    return "Unable to reach the server. Please check your internet connection and try again.";
  }
  if (err.code === "ECONNABORTED" || err.message?.includes("timeout")) {
    return "The request took too long. Please try again.";
  }
  if (err.code === "ERR_BAD_RESPONSE") {
    return "The server returned an unexpected response. Please try again.";
  }

  // Validation errors (array of field errors)
  const validationErrors = err.response?.data?.errors;
  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    const firstMsg = validationErrors[0]?.message;
    if (firstMsg) return firstMsg;
  }

  // Generic HTTP status fallbacks
  const status = err.response?.status;
  const statusFallbacks = {
    400: "The request could not be processed. Please check your information and try again.",
    401: "Your session has expired. Please log in again.",
    403: "You do not have permission to perform this action.",
    404: "The requested resource could not be found.",
    409: "This action conflicts with existing data. Please refresh and try again.",
    422: "Please review your input and try again.",
    429: "Too many requests. Please wait a moment and try again.",
    500: "An unexpected error occurred. Please try again later.",
    502: "The server is temporarily unavailable. Please try again soon.",
    503: "The service is temporarily unavailable. Please try again later.",
  };
  if (status && statusFallbacks[status]) {
    return statusFallbacks[status];
  }

  // err.message as last resort (Axios gives "Request failed with status code 4XX")
  if (err.message && !err.message.startsWith("Request failed")) {
    return err.message;
  }

  // Context-specific fallback beats generic
  if (contextMsg) return contextMsg;

  return "An unexpected error occurred. Please try again.";
}

/**
 * For use with react-hot-toast: returns an options object that limits
 * message length and adds a stable id to prevent duplicate toasts.
 */
export function toastErrorOptions(duration = 5000) {
  return {
    duration,
    id: `error-${Date.now()}`,
  };
}
