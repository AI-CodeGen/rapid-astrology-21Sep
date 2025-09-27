import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api';
import Box from '../components/ui/Box.jsx';
import Card from '../components/ui/Card.jsx';

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
  api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` }}) // baseURL already /api/v1
        .then(r => {
          const user = r.data?.data?.user;
          if (!user) throw new Error('Missing user in response');
          login(token, user);
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

  return (
    <Box>
      <div className="max-w-md">
        <Card title="OAuth">
          <p className="text-sm text-slate-600 dark:text-slate-300">Completing OAuth login...</p>
        </Card>
      </div>
    </Box>
  );
}
