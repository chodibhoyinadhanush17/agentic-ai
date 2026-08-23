import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuthStore } from '../../store/authStore.js';
import { useWorkflowStore } from '../../store/workflowStore.js';
import { useThemeStore } from '../../store/themeStore.js';
import { getSocket } from '../../services/socket.js';
import api from '../../services/api.js';
import {
  LayoutDashboard,
  Workflow,
  Sparkles,
  PlayCircle,
  Puzzle,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Sun,
  Moon,
  Activity,
  CheckCheck,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const AppShell = ({ children }) => {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, setNotifications, addNotification, markAllNotificationsRead } = useWorkflowStore();
  const { theme, toggleTheme } = useThemeStore();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data) setNotifications(res.data);
      } catch (err) {
        // quiet fallback
      }
    };
    fetchNotifications();

    const socket = getSocket();
    if (socket) {
      setIsLiveConnected(socket.connected);

      const onConnect = () => setIsLiveConnected(true);
      const onDisconnect = () => setIsLiveConnected(false);
      const onNotification = (notif) => addNotification(notif);

      socket.on('connect', onConnect);
      socket.on('disconnect', onDisconnect);
      socket.on('notification:new', onNotification);
      socket.on('notification:broadcast', onNotification);

      return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('notification:new', onNotification);
        socket.off('notification:broadcast', onNotification);
      };
    }
  }, [setNotifications, addNotification]);

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Workflows', href: '/workflows', icon: Workflow },
    { name: 'AI Builder', href: '/workflows/builder', icon: Sparkles, badge: 'AI' },
    { name: 'Executions', href: '/executions', icon: PlayCircle },
    { name: 'Integrations', href: '/integrations', icon: Puzzle },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-surface-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-200 dark:border-surface-800/80 bg-white/90 dark:bg-surface-900/90 backdrop-blur-md">
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 dark:border-surface-800/80 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 shadow-md shadow-brand-500/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-slate-900 dark:text-white">
              <span>Agentflow</span>
              <span className="rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">AI</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Autonomous Ops Console</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = router.pathname === item.href || (item.href !== '/dashboard' && router.pathname.startsWith(item.href) && item.href !== '/workflows/builder');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300 shadow-sm border border-brand-200 dark:border-brand-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="rounded bg-indigo-100 dark:bg-indigo-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-300">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* System Status Banner */}
        <div className="border-t border-slate-200 dark:border-surface-800/80 p-4">
          <div className="rounded-lg bg-slate-100 dark:bg-surface-850 p-3 border border-slate-200 dark:border-surface-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Live Agent Socket</span>
              <span className="flex items-center gap-1 font-medium">
                <span className={`h-2 w-2 rounded-full ${isLiveConnected ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'}`} />
                <span className={isLiveConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}>
                  {isLiveConnected ? 'Active' : 'Connecting'}
                </span>
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Agent Chain</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">5 Cooperating Agents</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-surface-800/80 bg-white/70 dark:bg-surface-900/60 px-6 backdrop-blur-md">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
              {router.pathname.split('/')[1] || 'Dashboard'}
            </span>
            {router.query.id && (
              <>
                <ChevronRight className="h-4 w-4 text-slate-400 dark:text-slate-600" />
                <span className="font-mono text-xs text-brand-600 dark:text-brand-400">{String(router.query.id).slice(0, 10)}...</span>
              </>
            )}
          </div>

          {/* Actions & User Profile */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-surface-800 bg-slate-100 dark:bg-surface-850 px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-surface-800"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} theme`}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Dark Mode</span>
                </>
              )}
            </button>

            {/* Quick AI Builder Button */}
            <Link
              href="/workflows/builder"
              className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-brand-600/30 transition hover:bg-brand-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Prompt to Graph</span>
            </Link>

            {/* Notifications Button */}
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative rounded-lg border border-slate-200 dark:border-surface-800 bg-slate-100 dark:bg-surface-850 p-2 text-slate-600 dark:text-slate-400 transition hover:bg-slate-200 dark:hover:bg-surface-800"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* User Profile Pill */}
            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-surface-800 pl-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-surface-800 border border-brand-300 dark:border-brand-500/30 font-semibold text-xs text-brand-700 dark:text-brand-300">
                  {user?.name ? user.name[0].toUpperCase() : 'O'}
                </div>
                <div className="hidden text-left md:block">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{user?.name || 'Operator'}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider">{user?.role || 'operator'}</p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => {
                  logout();
                  router.push('/login');
                }}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-surface-800 hover:text-red-500"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Dynamic Page Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-surface-950 p-6">
          {children}
        </main>
      </div>

      {/* Notifications Drawer */}
      {isNotificationsOpen && (
        <div className="fixed inset-y-0 right-0 z-50 flex w-96 flex-col border-l border-slate-200 dark:border-surface-800 bg-white dark:bg-surface-900 shadow-2xl backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-surface-800 px-5">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-brand-600 dark:text-brand-400" />
              <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Audit & Alerts</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-xs text-brand-700 dark:text-brand-300 font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  <span>Mark read</span>
                </button>
              )}
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 dark:text-slate-500">
                <Bell className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No notifications yet.</p>
                <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Timeline events and agent alerts will appear here.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const isErr = notif.type === 'error';
                const isSuccess = notif.type === 'success';
                const isWarn = notif.type === 'warning';
                return (
                  <div
                    key={notif._id || notif.id}
                    className={`rounded-lg border p-3 text-left transition ${
                      notif.isRead
                        ? 'border-slate-200 dark:border-surface-800 bg-slate-50 dark:bg-surface-850/50 text-slate-500 dark:text-slate-400'
                        : 'border-brand-300 dark:border-brand-500/30 bg-brand-50/50 dark:bg-surface-800 text-slate-800 dark:text-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {isErr ? (
                        <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                      ) : isSuccess ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : isWarn ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <Info className="h-4 w-4 text-brand-500 dark:text-brand-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">{notif.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
                          {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString() : 'Just now'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppShell;
