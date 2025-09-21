import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import DisciplineMenu from './DisciplineMenu';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.5rem 1rem', background:'#2d2d72', color:'#fff' }}>
      <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
        <Link to='/' style={{ color:'#fff', textDecoration:'none', fontWeight:'bold' }}>Rapid Astrology</Link>
        <DisciplineMenu />
      </div>
      <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
        {token ? (
          <>
            <Link to='/profile' style={{ color:'#fff' }}>{user?.name || 'Profile'}</Link>
            <button onClick={() => { logout(); navigate('/'); }} style={{ padding:'0.25rem 0.5rem' }}>Logout</button>
          </>
        ) : (
          <Link to='/login' style={{ color:'#fff' }}>Login</Link>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
