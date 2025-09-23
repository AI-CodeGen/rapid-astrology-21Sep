import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { navGroups } from './navigationData';
import { X } from 'lucide-react';

// Simple focus trap helper
function useFocusTrap(active, containerRef, onClose) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;
    const focusable = container.querySelectorAll('a,button');
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    function handleKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
      if (e.key === 'Tab') {
        if (focusable.length === 0) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    }
    document.addEventListener('keydown', handleKey);
    first && first.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [active, onClose]);
}

export default function MobileMenu({ open, onClose }) {
  const ref = useRef(null);
  const [isPresent, setIsPresent] = useState(open);
  const [closing, setClosing] = useState(false);
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  useFocusTrap(open, ref, onClose);

  useEffect(() => {
    if (open) {
      const prev = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';
      return () => { document.documentElement.style.overflow = prev; };
    }
  }, [open]);

  // Mount presence
  useEffect(() => {
    if (open) {
      setIsPresent(true);
      setClosing(false);
    } else if (isPresent) {
      // trigger exit
      setClosing(true);
      const t = setTimeout(() => { setIsPresent(false); setClosing(false); }, 220);
      return () => clearTimeout(t);
    }
  }, [open, isPresent]);

  if (!isPresent) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className={`absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity duration-200 ${closing ? 'opacity-0' : 'opacity-100'}`}
        onClick={() => !closing && onClose()}
        aria-hidden="true"
      />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`absolute inset-y-0 right-0 w-80 max-w-[85%] glass rounded-l-2xl p-5 flex flex-col gap-6 overflow-y-auto will-change-transform transition-transform duration-200 ease-out ${closing ? 'translate-x-full' : 'translate-x-0'} translate-z-0`}
      >
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight">Navigation</span>
          <button onClick={() => !closing && onClose()} className="btn-ghost w-9 h-9 rounded-full" aria-label="Close menu"><X className="h-5 w-5" /></button>
        </div>
        <nav className="space-y-6">
          {navGroups.map(group => (
            <div key={group.id}>
              <p className="text-xs uppercase tracking-wider text-slate-400 mb-2">{group.label}</p>
              <ul className="space-y-1">
                {group.items.map(item => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      className="block px-3 py-2 rounded-md text-sm font-medium text-slate-100 hover:bg-white/10 focus:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    >{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="mt-auto space-y-3 pt-4 border-t border-white/10">
          {token ? (
            <>
              <div className="text-sm text-slate-300">Signed in as <span className="font-medium text-white">{user?.name || 'User'}</span></div>
              <button
                onClick={() => { logout(); onClose(); navigate('/'); }}
                className="btn-primary w-full justify-center"
              >Logout</button>
            </>
          ) : (
            <Link to="/login" onClick={onClose} className="btn-primary w-full justify-center">Login</Link>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
