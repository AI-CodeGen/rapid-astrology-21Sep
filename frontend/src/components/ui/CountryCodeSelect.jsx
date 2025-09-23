import React from 'react';
import clsx from 'clsx';

// Minimal subset; can be extended
const COUNTRY_CODES = [
  { code: '+91', label: 'India', flag: '🇮🇳' },
  { code: '+1', label: 'USA', flag: '🇺🇸' },
  { code: '+44', label: 'UK', flag: '🇬🇧' },
  { code: '+61', label: 'Australia', flag: '🇦🇺' },
  { code: '+971', label: 'UAE', flag: '🇦🇪' }
];

export default function CountryCodeSelect({ value, onChange, className='' }) {
  return (
    <select
      value={value}
      onChange={e=>onChange(e.target.value)}
      className={clsx('rounded-l-lg border border-slate-300 dark:border-slate-600 bg-white/90 dark:bg-slate-800/80 pl-2 pr-6 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-brand-500', className)}
      aria-label="Country code"
    >
      {COUNTRY_CODES.map(c => (
        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
      ))}
    </select>
  );
}

export { COUNTRY_CODES };