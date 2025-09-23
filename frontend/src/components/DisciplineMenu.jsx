import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { navGroups as menu } from './navigationData';

export default function DisciplineMenu() {
  const [openMenu, setOpenMenu] = useState(null); // id of open top-level menu
  const buttonsRef = useRef({});
  const listsRef = useRef({});
  const location = useLocation();

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (!openMenu) return;
      const listEl = listsRef.current[openMenu];
      const btnEl = buttonsRef.current[openMenu];
      if (listEl && !listEl.contains(e.target) && btnEl && !btnEl.contains(e.target)) {
        setOpenMenu(null);
      }
    }
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  // Close on route change
  useEffect(() => {
    setOpenMenu(null);
  }, [location.pathname]);

  const handleTopLevelKey = useCallback((e, group) => {
    const idx = menu.findIndex(m => m.id === group.id);
    if (['ArrowRight','ArrowLeft'].includes(e.key)) {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = (idx + dir + menu.length) % menu.length;
      buttonsRef.current[menu[next].id]?.focus();
    } else if (['Enter',' '].includes(e.key)) {
      e.preventDefault();
      setOpenMenu(prev => prev === group.id ? null : group.id);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpenMenu(group.id);
      // Focus first item asynchronously after open
      setTimeout(() => {
        const first = listsRef.current[group.id]?.querySelector('a');
        first && first.focus();
      }, 0);
    }
  }, []);

  const handleListKey = (e, group) => {
    const links = Array.from(listsRef.current[group.id]?.querySelectorAll('a') || []);
    const currentIndex = links.indexOf(document.activeElement);
    if (e.key === 'Escape') {
      setOpenMenu(null);
      buttonsRef.current[group.id]?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = (currentIndex + 1) % links.length;
      links[next]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = (currentIndex - 1 + links.length) % links.length;
      links[prev]?.focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      links[0]?.focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      links[links.length - 1]?.focus();
    } else if (e.key === 'Tab') {
      // Allow tab but close menu if focus leaves list
      setTimeout(() => {
        if (!listsRef.current[group.id]?.contains(document.activeElement)) {
          setOpenMenu(null);
        }
      }, 0);
    }
  };

  return (
    <nav aria-label="Primary" role="menubar" className="flex gap-4">
      {menu.map(group => {
        const isOpen = openMenu === group.id;
        return (
          <div key={group.id} className="relative">
            <button
              ref={el => buttonsRef.current[group.id] = el}
              aria-haspopup="true"
              aria-expanded={isOpen}
              aria-controls={`menu-${group.id}`}
              role="menuitem"
              onClick={() => setOpenMenu(isOpen ? null : group.id)}
              onKeyDown={(e) => handleTopLevelKey(e, group)}
              className={"text-sm font-medium tracking-wide text-slate-200 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 px-1 py-2 flex items-center gap-1 group"}
            >
              {group.label}
              <span aria-hidden="true" className={`transition-transform text-xs mt-0.5 ${isOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {isOpen && (
              <div
                id={`menu-${group.id}`}
                ref={el => listsRef.current[group.id] = el}
                role="menu"
                aria-label={group.label}
                onKeyDown={(e) => handleListKey(e, group)}
                className="absolute left-0 mt-2 w-56 origin-top-left rounded-lg glass p-2 backdrop-saturate-150 animate-scale-in border border-white/10 shadow-xl focus:outline-none"
              >
                {group.items.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    role="menuitem"
                    tabIndex={0}
                    className="block rounded-md px-3 py-2 text-sm text-slate-100 hover:bg-white/10 focus:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
