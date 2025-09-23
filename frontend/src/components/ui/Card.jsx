import React from 'react';
import clsx from 'clsx';

export function Card({ title, actions, className = '', children, centerTitle = false }) {
  return (
    <section
      className={clsx(
        'card relative rounded-xl bg-white/70 dark:bg-slate-900/70 backdrop-blur border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-shadow',
        'p-6 sm:p-8 space-y-4',
        className
      )}
    >
      {(title || actions) && (
        <header
          className={clsx(
            'flex items-start gap-4 mb-2',
            actions ? 'justify-between' : (centerTitle ? 'justify-center text-center' : 'justify-between')
          )}
        >
          {title && (
            <h2
              className={clsx(
                'text-lg font-semibold tracking-tight text-slate-800 dark:text-slate-100',
                centerTitle && !actions && 'w-full'
              )}
            >
              {title}
            </h2>
          )}
          {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default Card;