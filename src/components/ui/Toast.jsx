import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, Flame, Info, X, AlertCircle } from 'lucide-react';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, info: Info, streak: Flame, error: AlertCircle };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);
  const push = useCallback(
    ({ title, message, tone = 'info', duration = 6000 }) => {
      const id = `${Date.now()}-${Math.random()}`;
      setToasts((t) => [...t, { id, title, message, tone }]);
      if (duration) setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo(() => ({ push, dismiss }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.tone] || Info;
          return (
            <div key={t.id} className={`toast ${t.tone}`}>
              <i>
                <Icon size={18} />
              </i>
              <div>
                <strong>{t.title}</strong>
                {t.message && <p>{t.message}</p>}
              </div>
              <button className="close" onClick={() => dismiss(t.id)} aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
