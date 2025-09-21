import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return <button onClick={toggle} style={{ padding: '0.25rem 0.5rem' }}>{theme === 'day' ? 'Night Mode' : 'Day Mode'}</button>;
}
