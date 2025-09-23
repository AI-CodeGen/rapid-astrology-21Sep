import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import ThemeToggle from '../ThemeToggle.jsx';
import { navGroups } from '../navigationData.js';
import { Menu, X, LogOut } from 'lucide-react';
import clsx from 'clsx';

// New standardized header bar (fixed)
export default function HeaderBar({ onOpenMobile, mobileOpen, onCloseMobile }) {
  const { user, logout, token } = useAuth();
  const toast = useToast();
  const logoutLock = useRef(false);

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
            Rapid Astrology
          </Link>
          <GroupMenus />
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
                  onClick={() => { if (logoutLock.current) return; logoutLock.current = true; logout(); toast.success('Logout successful'); setTimeout(()=>{ logoutLock.current=false; }, 600); }}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium bg-slate-200/70 dark:bg-slate-700/70 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
                  disabled={logoutLock.current}
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

// Desktop group dropdown menus
function GroupMenus() {
  const [open, setOpen] = useState(null); // group id
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(null);
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(null);
    }
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <nav ref={containerRef} className="hidden lg:flex items-center gap-4 text-sm" aria-label="Primary">
      {navGroups.map(group => {
        const isOpen = open === group.id;
        return (
          <div key={group.id} className="relative">
            <button
              onClick={() => setOpen(isOpen ? null : group.id)}
              aria-haspopup="true"
              aria-expanded={isOpen}
              aria-controls={`menu-${group.id}`}
              className={clsx(
                'inline-flex items-center gap-1 px-1 py-2 font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded-md',
                'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              {group.label}
              <span className={clsx('text-xs transition-transform', isOpen && 'rotate-180')}>▼</span>
            </button>
            {isOpen && (
              <div
                id={`menu-${group.id}`}
                role="menu"
                aria-label={group.label}
                className="absolute left-0 top-full mt-2 min-w-[14rem] rounded-lg border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur shadow-lg p-2 z-50 animate-scale-in"
              >
                {group.items.map(item => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    role="menuitem"
                    className={({ isActive }) => clsx(
                      'block w-full text-left px-3 py-2 rounded-md text-sm transition',
                      'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                      isActive && 'bg-brand-600/10 text-slate-900 dark:text-white'
                    )}
                    onClick={() => setOpen(null)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}