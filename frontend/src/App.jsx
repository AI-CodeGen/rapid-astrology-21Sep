import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
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

export default function App() {
  const { theme } = useTheme();
  return (
    <div className={theme === 'night' ? 'theme-night' : 'theme-day'} style={{ fontFamily: 'sans-serif', minHeight: '100vh' }}>
      <Header />
      <div style={{ padding: '1rem' }}>
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
      </div>
    </div>
  );
}
