import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Contrast } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme, highContrast, toggleHighContrast } = useTheme();
  const isNight = theme === 'night';
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={isNight ? 'Switch to day mode' : 'Switch to night mode'}
        className="btn-ghost w-10 h-10 flex items-center justify-center rounded-full relative"
      >
        <Sun className={`absolute h-5 w-5 transition-all duration-300 ${isNight ? 'scale-0 opacity-0 rotate-90' : 'scale-100 opacity-100 rotate-0'}`} />
        <Moon className={`h-5 w-5 transition-all duration-300 ${isNight ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-90'}`} />
      </button>
      <button
        type="button"
        onClick={toggleHighContrast}
        aria-pressed={highContrast}
        aria-label={highContrast ? 'Disable high contrast mode' : 'Enable high contrast mode'}
        className={`btn-ghost w-10 h-10 flex items-center justify-center rounded-full relative ${highContrast ? 'ring-2 ring-brand-400 ring-offset-2 ring-offset-slate-900 dark:ring-offset-slate-800' : ''}`}
        title={highContrast ? 'High contrast enabled' : 'Enable high contrast'}
      >
        <Contrast className={`h-5 w-5 transition-colors ${highContrast ? 'text-brand-300' : 'text-slate-300 dark:text-slate-400'}`} />
        <span className="sr-only">High contrast toggle</span>
      </button>
    </div>
  );
}
