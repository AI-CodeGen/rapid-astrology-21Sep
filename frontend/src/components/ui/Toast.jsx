import React, { useEffect } from 'react';
import clsx from 'clsx';

/**
 * Simple toast component.
 * Props:
 * - open: boolean to show/hide
 * - onClose: function called when auto-hide or manual close
 * - intent: 'success' | 'error' | 'info'
 * - children: content
 * - duration: ms (default 3000)
 */
export default function Toast({ open, onClose, intent='info', children, duration=3000 }) {
  useEffect(()=>{
    if (!open) return;
    const id = setTimeout(()=>onClose?.(), duration);
    return ()=>clearTimeout(id);
  }, [open, duration, onClose]);

  if (!open) return null;

  const intentClasses = {
    success: 'bg-emerald-600/95 text-white ring-emerald-400/50',
    error: 'bg-rose-600/95 text-white ring-rose-400/50',
    info: 'bg-slate-800/95 text-slate-100 ring-slate-400/30'
  }[intent] || intentClasses?.info;

  return (
    <div
      role={intent === 'error' ? 'alert' : 'status'}
      aria-live={intent === 'error' ? 'assertive' : 'polite'}
      className={clsx('fixed z-50 bottom-4 right-4 max-w-sm w-full animate-fade-in', intentClasses)}
    >
      <div className="px-4 py-3 text-sm flex items-start gap-3">
        <div className="flex-1">{children}</div>
        <button
          onClick={onClose}
          className="mt-0.5 inline-flex items-center justify-center rounded-md text-xs px-2 py-1 bg-black/20 hover:bg-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 transition"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}