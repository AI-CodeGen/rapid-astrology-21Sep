import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    // Extract token from hash or query (?token= or #token=)
    const searchParams = new URLSearchParams(window.location.search);
    let token = searchParams.get('token');
    if (!token && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      token = hashParams.get('token');
    }
    if (token) {
      localStorage.setItem('token', token);
      // Fetch profile
      api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` }})
        .then(r => {
          login(token, r.data.user);
          navigate('/profile');
        })
        .catch(() => {
          // fallback navigate home on failure
          navigate('/');
        });
    } else {
      navigate('/login');
    }
  }, [login, navigate]);

  return <div>Completing OAuth login...</div>;
}
