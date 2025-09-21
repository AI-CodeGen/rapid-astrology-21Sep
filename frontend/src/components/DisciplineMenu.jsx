import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Accessible menu data (added Destiny Match)
const menu = [
  { label: 'Numerology', id: 'numerology', items: [
      { label:'Name Number', path:'/numerology/name-number' },
      { label:'Destiny Match', path:'/numerology/destiny-match' }
    ] },
  { label: 'Astrology', id: 'astrology', items: [
      { label:'Kundli', path:'/astrology/kundli' },
      { label:'KP Astrology', path:'/astrology/kp' },
      { label:'Kundli Matching', path:'/astrology/kundli-matching' }
    ] }
];

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
    <nav aria-label="Primary" role="menubar" style={{ display:'flex', gap:'1rem' }}>
      {menu.map(group => {
        const isOpen = openMenu === group.id;
        return (
          <div key={group.id} style={{ position:'relative' }}>
            <button
              ref={el => buttonsRef.current[group.id] = el}
              aria-haspopup="true"
              aria-expanded={isOpen}
              aria-controls={`menu-${group.id}`}
              role="menuitem"
              onClick={() => setOpenMenu(isOpen ? null : group.id)}
              onKeyDown={(e) => handleTopLevelKey(e, group)}
              style={{ fontWeight:'bold', background:'none', border:'none', cursor:'pointer' }}
            >
              {group.label}
              <span aria-hidden="true" style={{ marginLeft:4 }}>{isOpen ? '▲' : '▼'}</span>
            </button>
            {isOpen && (
              <div
                id={`menu-${group.id}`}
                ref={el => listsRef.current[group.id] = el}
                role="menu"
                aria-label={group.label}
                onKeyDown={(e) => handleListKey(e, group)}
                style={{ display:'flex', flexDirection:'column', position:'absolute', background:'#fff', padding:'0.5rem', border:'1px solid #ccc', zIndex:10, minWidth:180 }}
              >
                {group.items.map(item => (
                  <Link
                    key={item.path}
                    to={item.path}
                    role="menuitem"
                    tabIndex={0}
                    style={{ padding:'0.25rem 0', textDecoration:'none', color:'#333' }}
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
