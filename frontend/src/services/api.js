import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { toastBridge } from '../utils/toastBridge';
import { authBridge } from '../utils/authBridge';

// Versioned API base path
const api = axios.create({ baseURL: '/api/v1' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = 'Bearer ' + token;
  // Propagate / generate request correlation ID if caller didn't set one
  if (!cfg.headers['x-request-id']) {
    cfg.headers['x-request-id'] = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : uuidv4();
  }
  return cfg;
});

api.interceptors.response.use(
  res => {
    // Attach request id onto response data meta if available (non-mutating original data shape)
    const reqId = res.headers['x-request-id'];
    if (reqId && res.data && typeof res.data === 'object' && !res.data.requestId) {
      // Non-destructive augmentation (only if backend didn't already include it)
      res.data.requestId = reqId;
    }
    return res;
  },
  err => {
    if (err?.response?.status === 401) {
      if (localStorage.getItem('token')) {
        authBridge.expireSession();
        toastBridge.info('Session expired. Please login again.');
      }
    }
    // Surface request id for error handling/logging layers
    const reqId = err?.response?.headers?.['x-request-id'];
    if (reqId) err.requestId = reqId;
    return Promise.reject(err);
  }
);

export default api;
