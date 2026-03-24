import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, Info, XCircle, X } from "lucide-react";

/* ══════════════════════════════════════════════
   Toast / Snackbar Notification System
   Ref: Spec "snackbar ด้านล่าง เพื่อให้ผู้ใช้ทราบผลลัพธ์"
   ══════════════════════════════════════════════ */

type ToastType = "success" | "error" | "warning" | "info";

type Toast = {
  id: number;
  type: ToastType;
  message: string;
};

const icons: Record<ToastType, React.ElementType> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles: Record<ToastType, string> = {
  success: "bg-success-bg border-success/30 text-success",
  error: "bg-danger-bg border-danger/30 text-danger",
  warning: "bg-warning-bg border-warning/30 text-warning",
  info: "bg-info-bg border-info/30 text-info",
};

type ToastContextType = {
  toast: (type: ToastType, message: string) => void;
};

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export function useToast() { return useContext(ToastContext); }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  let nextId = 0;

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now() + (nextId++);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = (id: number) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 space-y-2 max-w-sm">
        {toasts.map(t => {
          const Icon = icons[t.type];
          return (
            <div key={t.id}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-lg animate-in slide-in-from-right ${styles[t.type]}`}
              style={{ animation: "slideIn 0.3s ease-out" }}>
              <Icon size={16} className="shrink-0" />
              <p className="text-sm font-medium flex-1">{t.message}</p>
              <button onClick={() => removeToast(t.id)} className="opacity-50 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
