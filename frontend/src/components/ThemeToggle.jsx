import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isNight = theme === 'night';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isNight ? 'Switch to day mode' : 'Switch to night mode'}
      className="btn-ghost w-10 h-10 flex items-center justify-center rounded-full relative"
    >
      <Sun className={`absolute h-5 w-5 transition-all duration-300 ${isNight ? 'scale-0 opacity-0 rotate-90' : 'scale-100 opacity-100 rotate-0'}`} />
      <Moon className={`h-5 w-5 transition-all duration-300 ${isNight ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-90'}`} />
    </button>
  );
}
