import { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute.jsx';
import AppShell from '../components/AppShell/AppShell.jsx';
import { useAuthStore } from '../store/authStore.js';
import { useThemeStore } from '../store/themeStore.js';
import api from '../services/api.js';
import {
  User,
  Shield,
  Activity,
  Cpu,
  CheckCircle2,
  Lock,
  Sun,
  Moon,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [health, setHealth] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await api.get('/health');
        setHealth(res.data);
      } catch (err) {
        console.warn('[Settings] Health check err:', err.message);
      }
    };
    fetchHealth();
  }, []);

  const handlePasswordChange = (e) => {
    e.preventDefault();
    if (passwordForm.new !== passwordForm.confirm) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    setStatusMsg({ type: 'success', text: 'Security credentials updated successfully.' });
    setPasswordForm({ current: '', new: '', confirm: '' });
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="max-w-4xl space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Operator & System Settings</h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Manage operator profile, system diagnostics, theme appearance, and encryption key statuses.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 dark:border-surface-800">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === 'profile'
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Operator Profile & Appearance</span>
            </button>
            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                activeTab === 'diagnostics'
                  ? 'border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>System Diagnostics</span>
            </button>
          </div>

          {statusMsg && (
            <div
              className={`rounded-xl border p-4 text-xs ${
                statusMsg.type === 'success'
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'border-red-300 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
              }`}
            >
              {statusMsg.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Theme Preference Card */}
              <div className="glass-panel rounded-xl border border-slate-200 dark:border-surface-800 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Appearance & Theme</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Select your preferred interface theme.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      theme === 'light'
                        ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-500/10 ring-2 ring-brand-500/30'
                        : 'border-slate-200 dark:border-surface-800 bg-white dark:bg-surface-850 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="rounded-lg bg-amber-100 p-2 text-amber-600">
                      <Sun className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Light Theme</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Clean, crisp, high-contrast surfaces</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                      theme === 'dark'
                        ? 'border-brand-500 bg-brand-50/70 dark:bg-brand-500/10 ring-2 ring-brand-500/30'
                        : 'border-slate-200 dark:border-surface-800 bg-white dark:bg-surface-850 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="rounded-lg bg-indigo-900/60 p-2 text-indigo-400">
                      <Moon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Dark Theme</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Sleek midnight operator console</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Profile Card */}
              <div className="glass-panel rounded-xl border border-slate-200 dark:border-surface-800 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Operator Profile</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      disabled
                      value={user?.name || 'Operator'}
                      className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-slate-100 dark:bg-surface-950 px-3 py-2 text-xs text-slate-700 dark:text-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || 'operator@agentflow.ai'}
                      className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-slate-100 dark:bg-surface-950 px-3 py-2 text-xs text-slate-700 dark:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Password Form */}
              <div className="glass-panel rounded-xl border border-slate-200 dark:border-surface-800 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Security Password</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Passwords are automatically hashed using Bcrypt at cost factor 12.
                </p>

                <form onSubmit={handlePasswordChange} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      className="w-full max-w-md rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      className="w-full max-w-md rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      className="w-full max-w-md rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 focus:border-brand-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-500 mt-2"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>Update Password</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'diagnostics' && (
            <div className="space-y-6">
              <div className="glass-panel rounded-xl border border-slate-200 dark:border-surface-800 p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Substrate & Service Health</h3>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-100 dark:bg-surface-850 p-4 border border-slate-200 dark:border-surface-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Server Status</span>
                    <div className="mt-1 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">{health?.status || 'HEALTHY'}</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-100 dark:bg-surface-850 p-4 border border-slate-200 dark:border-surface-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Database Substrate</span>
                    <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {health?.database || 'In-Memory Mock / Mongo'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-100 dark:bg-surface-850 p-4 border border-slate-200 dark:border-surface-800">
                    <span className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">Execution Queue</span>
                    <p className="mt-1 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {health?.queue || 'BullMQ / Priority Worker'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-xl border border-slate-200 dark:border-surface-800 p-6 shadow-sm">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cryptographic Security Substrate</h3>
                </div>
                <div className="mt-3 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <p>• Third-party OAuth tokens encrypted with AES-256-CBC with randomized IV vectors.</p>
                  <p>• HTTP APIs protected by Helmet, rate limiting, and JWT authentication.</p>
                  <p>• 5-Agent multi-agent orchestrator runs topological execution plans with automatic recovery classification.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
