import axios from 'axios';
import { toastBridge } from '../utils/toastBridge';
import { authBridge } from '../utils/authBridge';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = 'Bearer ' + token;
  return cfg;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err?.response?.status === 401) {
      // If we still have a token locally, treat it as expired
      if (localStorage.getItem('token')) {
        authBridge.expireSession();
        toastBridge.info('Session expired. Please login again.');
      }
    }
    return Promise.reject(err);
  }
);

export default api;
