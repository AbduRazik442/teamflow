
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

const ToastContext = createContext(null);

let nextToastId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismissToast = useCallback((id) => {
    const timer = timers.current.get(id);

    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }

    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }, []);

  const showToast = useCallback(
    (message, type = "success", duration = 4000) => {
      const id = nextToastId++;

      setToasts((current) => [
        ...current,
        { id, message, type },
      ]);

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);

        timers.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (message, duration) =>
      showToast(message, "success", duration),
    [showToast]
  );

  const error = useCallback(
    (message, duration) =>
      showToast(message, "error", duration),
    [showToast]
  );

  const info = useCallback(
    (message, duration) =>
      showToast(message, "info", duration),
    [showToast]
  );

  useEffect(() => {
    const activeTimers = timers.current;

    return () => {
      activeTimers.forEach((timer) => clearTimeout(timer));
      activeTimers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{ success, error, info, dismissToast }}
    >
      {children}

      <div
        className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const styles = {
            success:
              "border-emerald-200 bg-white text-emerald-800 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300",
            error:
              "border-red-200 bg-white text-red-800 dark:border-red-800 dark:bg-slate-900 dark:text-red-300",
            info:
              "border-blue-200 bg-white text-blue-800 dark:border-blue-800 dark:bg-slate-900 dark:text-blue-300",
          };

          const icons = {
            success: "✓",
            error: "!",
            info: "i",
          };

          return (
            <div
              key={toast.id}
              role={toast.type === "error" ? "alert" : "status"}
              aria-live={toast.type === "error" ? "assertive" : "polite"}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg ${styles[toast.type]}`}
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold dark:bg-slate-800">
                {icons[toast.type]}
              </span>

              <p className="flex-1 text-sm font-medium">
                {toast.message}
              </p>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="rounded px-1 text-lg leading-none opacity-70 hover:opacity-100"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}