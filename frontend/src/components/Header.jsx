import React, { useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import DisciplineMenu from './DisciplineMenu';
import MobileMenu from './MobileMenu';
import Container from './Container';
import { Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatProfileLabel } from '../utils/formatProfileLabel.js';
import { useToast } from '../context/ToastContext.jsx';

export default function Header() {
  const { token, user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const logoutLock = useRef(false);
  const profileLabel = useMemo(() => formatProfileLabel(user?.name), [user?.name]);

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/60 dark:bg-slate-950/50 border-b border-white/10">
      <Container className="h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link to='/' className="text-lg font-semibold tracking-tight text-white hover:text-brand-300 transition">
            Rapid <span className="text-brand-400">Astrology</span>
          </Link>
          <div className="hidden md:flex">
            <DisciplineMenu />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="md:hidden">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="btn-ghost w-10 h-10 rounded-full flex items-center justify-center"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
          {token ? (
            <>
              <Link to='/profile' className="btn-ghost max-w-[160px] truncate" title={profileLabel}>{profileLabel}</Link>
              <button
                onClick={() => {
                  if (logoutLock.current) return;
                  logoutLock.current = true;
                  logout();
                  navigate('/');
                  toast.success('Logout successful');
                  setTimeout(()=>{ logoutLock.current = false; }, 600);
                }}
                className="btn-primary px-3 py-2 text-sm disabled:opacity-50"
                disabled={logoutLock.current}
              >Logout</button>
            </>
          ) : (
            <Link to='/login' className="btn-primary px-4 py-2 text-sm">Login</Link>
          )}
          <ThemeToggle />
        </div>
      </Container>
      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </header>
  );
}
