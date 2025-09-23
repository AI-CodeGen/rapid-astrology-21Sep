import React, { createContext, useCallback, useContext, useRef, useState, useEffect } from 'react';
import clsx from 'clsx';
import { CheckCircle2, Info, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children, max = 5, duration = 4000 }) {
  const [toasts, setToasts] = useState([]);
  const queueRef = useRef([]);

  const remove = useCallback((id) => {
    setToasts(t => t.filter(toast => toast.id !== id));
  }, []);

  // Auto dismiss logic
  useEffect(() => {
    const timers = toasts.map(t => {
      if (t.persist) return null;
      return setTimeout(() => remove(t.id), t.duration || duration);
    }).filter(Boolean);
    return () => timers.forEach(clearTimeout);
  }, [toasts, remove, duration]);

  const push = useCallback((toast) => {
    const id = ++idCounter;
    const entry = { id, intent: 'info', duration, ...toast };
    queueRef.current.push(entry);
    flush();
    return id;
  }, [duration]);

  const flush = useCallback(() => {
    setToasts(current => {
      if (current.length >= max) {
        // remove oldest to make room
        return [...current.slice(1), queueRef.current.shift()].filter(Boolean);
      }
      if (queueRef.current.length === 0) return current;
      return [...current, queueRef.current.shift()];
    });
  }, [max]);

  const api = {
    push,
    info: (msg, opts={}) => push({ message: msg, intent: 'info', ...opts }),
    success: (msg, opts={}) => push({ message: msg, intent: 'success', ...opts }),
    error: (msg, opts={}) => push({ message: msg, intent: 'error', ...opts }),
    remove,
    clear: () => setToasts([])
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onRemove={remove} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastViewport({ toasts, onRemove }) {
  return (
    <div className="fixed z-50 bottom-4 right-4 flex flex-col gap-3 w-full max-w-sm">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const { id, intent, message } = toast;
  const intentStyles = {
    success: {
      container: 'bg-emerald-600/95 ring-emerald-400/40 text-white',
      icon: <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
    },
    error: {
      container: 'bg-rose-600/95 ring-rose-400/40 text-white',
      icon: <XCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
    },
    info: {
      container: 'bg-slate-800/95 ring-slate-500/30 text-slate-100',
      icon: <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
    }
  };
  const styles = intentStyles[intent] || intentStyles.info;

  return (
    <div
      role={intent === 'error' ? 'alert' : 'status'}
      aria-live={intent === 'error' ? 'assertive' : 'polite'}
      className={clsx('group relative overflow-hidden rounded-lg border border-white/10 px-4 py-3 shadow-lg backdrop-blur-md ring-1 flex items-start gap-3', styles.container,
        'animate-toast-enter will-change-transform')}
    >
      <span className="mt-0.5">{styles.icon}</span>
      <div className="pr-6 text-sm leading-relaxed flex-1">{message}</div>
      <button
        onClick={() => onRemove(id)}
        className="absolute top-1.5 right-1.5 h-6 w-6 inline-flex items-center justify-center rounded-md text-xs font-medium bg-black/25 hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        aria-label="Close notification"
      >×</button>
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-100 transition" />
    </div>
  );
}
