import { create } from 'zustand';
import api from '../services/api.js';
import { joinUserRoom } from '../services/socket.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initAuth: async () => {
    if (typeof window === 'undefined') {
      set({ isLoading: false });
      return;
    }

    const token = localStorage.getItem('agentflow_token');
    const savedUser = localStorage.getItem('agentflow_user');

    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        set({ user: parsed, token, isAuthenticated: true });
        joinUserRoom(parsed.id);
      }
      
      const res = await api.get('/auth/me');
      const userData = res.data || res;
      if (userData) {
        localStorage.setItem('agentflow_user', JSON.stringify(userData));
        set({ user: userData, token, isAuthenticated: true, isLoading: false });
        joinUserRoom(userData.id);
      }
    } catch (err) {
      console.warn('[AuthStore] Session validation failed:', err.message);
      localStorage.removeItem('agentflow_token');
      localStorage.removeItem('agentflow_user');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (credentials, maybePassword) => {
    set({ isLoading: true, error: null });
    try {
      const email = typeof credentials === 'object' ? credentials.email : credentials;
      const password = typeof credentials === 'object' ? credentials.password : maybePassword;

      const res = await api.post('/auth/login', { email, password });
      const payload = res.data || res;
      const { user, token } = payload;

      if (token) {
        localStorage.setItem('agentflow_token', token);
      }
      if (user) {
        localStorage.setItem('agentflow_user', JSON.stringify(user));
      }

      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      if (user?.id) {
        joinUserRoom(user.id);
      }
      return user;
    } catch (err) {
      const msg = err.message || 'Login failed';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  register: async (userData, maybeEmail, maybePassword, maybeRole) => {
    set({ isLoading: true, error: null });
    try {
      let name, email, password, role;
      if (typeof userData === 'object' && userData !== null) {
        name = userData.name;
        email = userData.email;
        password = userData.password;
        role = userData.role || 'operator';
      } else {
        name = userData;
        email = maybeEmail;
        password = maybePassword;
        role = maybeRole || 'operator';
      }

      const res = await api.post('/auth/register', { name, email, password, role });
      const payload = res.data || res;
      const { user, token } = payload;

      if (token) {
        localStorage.setItem('agentflow_token', token);
      }
      if (user) {
        localStorage.setItem('agentflow_user', JSON.stringify(user));
      }

      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      if (user?.id) {
        joinUserRoom(user.id);
      }
      return user;
    } catch (err) {
      const msg = err.message || 'Registration failed';
      set({ isLoading: false, error: msg });
      throw err;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agentflow_token');
      localStorage.removeItem('agentflow_user');
    }
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
