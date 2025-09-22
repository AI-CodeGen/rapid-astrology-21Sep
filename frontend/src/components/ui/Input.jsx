import React from 'react';
import clsx from 'clsx';

const base = 'block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-800/80 px-3 py-2 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 '
  + 'focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60';

export const Input = React.forwardRef(function Input({ className = '', ...props }, ref) {
  return <input ref={ref} className={clsx(base, className)} {...props} />;
});

export const Textarea = React.forwardRef(function Textarea({ className = '', rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={clsx(base, 'resize-y min-h-[120px]', className)} {...props} />;
});

export default Input;