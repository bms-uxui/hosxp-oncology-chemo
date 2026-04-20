import { useState, createContext, useContext, useCallback, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

/* ══════════════════════════════════════════════
   Toast / Snackbar Notification System
   ══════════════════════════════════════════════ */

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
  exiting?: boolean;
};

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
  error: "bg-red-50 border-red-200 text-red-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
};

const animStyles = `
@keyframes toastSlideIn {
  0% { opacity: 0; transform: translateX(100%); }
  100% { opacity: 1; transform: translateX(0); }
}
@keyframes toastSlideOut {
  0% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(100%); }
}
`;

type ToastContextType = {
  toast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
    }, 4000);
  }, []);

  const removeToast = (id: number) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 300);
  };

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      <style>{animStyles}</style>
      {children}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
        {toasts.map(t => {
          const Icon = icons[t.type];
          return (
            <div key={t.id}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-lg backdrop-blur-sm ${styles[t.type]}`}
              style={{ animation: t.exiting ? "toastSlideOut 0.3s ease-in forwards" : "toastSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)" }}>
              <Icon size={18} className="shrink-0" />
              <p className="text-sm font-semibold flex-1">{t.message}</p>
              <button onClick={() => removeToast(t.id)} className="opacity-40 hover:opacity-100 transition-opacity">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
