import React, { useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import HeaderBar from './components/ui/HeaderBar.jsx';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import NumerologyNameNumberPage from './pages/NumerologyNameNumberPage';
import NumerologyDestinyMatchPage from './pages/NumerologyDestinyMatchPage';
import OAuthCallback from './pages/OAuthCallback';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import PaymentPage from './pages/PaymentPage';
import { useTheme } from './context/ThemeContext';
import Container from './components/Container';

function SpotlightTracker() {
  const frame = useRef(0);
  useEffect(() => {
    const root = document.documentElement;
    function handleMove(e) {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        root.style.setProperty('--spot-x', x + '%');
        root.style.setProperty('--spot-y', y + '%');
      });
    }
    window.addEventListener('pointermove', handleMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handleMove);
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, []);
  return null;
}

export default function App() {
  const { theme } = useTheme();
  return (
    <div className={`min-h-screen font-sans spotlight-overlay selection:bg-brand-500/40 selection:text-white`}> 
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:rounded-md focus:bg-brand-600 focus:text-white focus:shadow-lg">Skip to content</a>
      <SpotlightTracker />
      <HeaderBar />
      <main id="main" className="relative py-6" role="main">
        <Container>
        <Routes>
          <Route path='/' element={<HomePage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/profile' element={<ProfilePage />} />
          <Route path='/numerology/name-number' element={<NumerologyNameNumberPage />} />
          <Route path='/numerology/destiny-match' element={<NumerologyDestinyMatchPage />} />
          <Route path='/oauth/callback' element={<OAuthCallback />} />
          <Route path='/payment/success' element={<PaymentSuccess />} />
          <Route path='/payment/failure' element={<PaymentFailure />} />
          <Route path='/payment' element={<PaymentPage />} />
        </Routes>
        </Container>
      </main>
    </div>
  );
}
