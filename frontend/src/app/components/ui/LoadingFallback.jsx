export default function LoadingFallback({ fullScreen = false, message }) {
  return (
    <div
      className={`flex items-center justify-center ${
        fullScreen ? "min-h-screen" : "min-h-[60vh]"
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="w-[42px] h-[42px] rounded-full border-[3px] border-surface-200 dark:border-surface-600 border-t-primary-600 animate-spin" />
        {message && (
          <p className="text-sm text-surface-400 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}
