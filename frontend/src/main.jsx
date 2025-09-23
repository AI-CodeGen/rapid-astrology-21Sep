import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext.jsx';
import { registerToastBridge } from './utils/toastBridge.js';
import { registerAuthBridge } from './utils/authBridge.js';
import { useAuth } from './context/AuthContext';
import './index.css';

function BridgeRegistrar({ children }) {
  const toast = useToast();
  const { logout } = useAuth();
  // register once
  React.useEffect(() => {
    registerToastBridge(toast);
    registerAuthBridge({ expireSession: () => logout({ expired: true }) });
  }, [toast, logout]);
  return children;
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <BridgeRegistrar>
              <App />
            </BridgeRegistrar>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
