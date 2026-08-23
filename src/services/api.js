import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Attach JWT Bearer token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('agentflow_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Normalize responses and catch 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      // If token expired and not on login page, redirect
      if (
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/register') &&
        window.location.pathname !== '/'
      ) {
        localStorage.removeItem('agentflow_token');
        localStorage.removeItem('agentflow_user');
        window.location.href = '/login?expired=1';
      }
    }

    const data = error.response?.data;
    const message =
      data?.error?.message ||
      data?.message ||
      (Array.isArray(data?.errors) && data.errors[0]?.msg) ||
      (typeof data?.errors === 'string' && data.errors) ||
      error.message ||
      'Network request failed';

    const code = data?.error?.code || 'REQUEST_ERROR';
    const err = new Error(message);
    err.code = code;
    err.status = error.response?.status;
    err.response = error.response;
    return Promise.reject(err);
  }
);

export default api;
