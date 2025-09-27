import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext.jsx';

export default function ProtectedRoute({ children }) {
  const { token } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const notified = useRef(false);
  useEffect(()=>{
    if (!token && !notified.current) {
      notified.current = true;
      toast.info('Please login to continue.');
    }
  }, [token, toast]);
  if (!token) return <Navigate to='/login' replace state={{ from: location }} />;
  return children;
}
