import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { ToastViewport } from '../components/ui/Toast';

const ToastContext = createContext(null);

const AUTO_DISMISS_MS = 4000;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const nextId = useRef(0);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (message, tone = 'info') => {
      const id = nextId.current++;
      setToasts((current) => {
        // Repeating the same message (e.g. the API is down and three queries
        // failed) should refresh the existing toast, not stack duplicates.
        if (current.some((toast) => toast.message === message && toast.tone === tone)) {
          return current;
        }
        return [...current, { id, message, tone }];
      });
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
      );
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      success: (message) => push(message, 'success'),
      error: (message) => push(message, 'error'),
      warning: (message) => push(message, 'warning'),
      info: (message) => push(message, 'info'),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
};
