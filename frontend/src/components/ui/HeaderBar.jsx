import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import ThemeToggle from '../ThemeToggle.jsx';
import { navGroups } from '../navigationData.js';
import { Menu, X, LogOut } from 'lucide-react';
import clsx from 'clsx';

// New standardized header bar (fixed)
export default function HeaderBar({ onOpenMobile, mobileOpen, onCloseMobile }) {
  const { user, logout, token } = useAuth();

  return (
    <header className="fixed top-0 inset-x-0 z-40">
      <div className="border-b border-slate-200/80 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
          <button
            className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            onClick={mobileOpen ? onCloseMobile : onOpenMobile}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/" className="font-semibold text-slate-800 dark:text-slate-100 tracking-tight text-lg">
            RapidAstro
          </Link>
          <nav className="hidden lg:flex items-center gap-6 text-sm">
            {navGroups.flatMap(g => g.items).map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => clsx(
                  'relative text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition',
                  isActive && 'text-slate-900 dark:text-white font-medium'
                )}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {token ? (
              <>
                <NavLink
                  to="/profile"
                  className={({ isActive }) => clsx(
                    'px-3 py-1.5 rounded-md text-sm font-medium bg-brand-600/90 hover:bg-brand-600 text-white shadow focus:outline-none focus:ring-2 focus:ring-brand-500',
                    isActive && 'ring-2 ring-brand-500'
                  )}
                >
                  {user?.name || 'Profile'}
                </NavLink>
                <button
                  onClick={logout}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-slate-200/70 dark:bg-slate-700/70 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) => clsx(
                  'px-3 py-1.5 rounded-md text-sm font-medium bg-brand-600/90 hover:bg-brand-600 text-white shadow focus:outline-none focus:ring-2 focus:ring-brand-500',
                  isActive && 'ring-2 ring-brand-500'
                )}
              >
                Login
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}