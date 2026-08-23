import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute.jsx';
import AppShell from '../components/AppShell/AppShell.jsx';
import MetricGrid from '../components/MetricGrid/MetricGrid.jsx';
import api from '../services/api.js';
import {
  Sparkles,
  Plus,
  PlayCircle,
  Activity,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, wfRes] = await Promise.all([
        api.get('/workflows/dashboard'),
        api.get('/workflows?limit=4'),
      ]);
      setStats(statsRes.data);
      setWorkflows(wfRes.data?.items || []);
    } catch (err) {
      console.warn('[Dashboard] Failed to fetch data:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleQuickRun = async (workflowId) => {
    try {
      const res = await api.post(`/workflows/${workflowId}/execute`, {});
      if (res.data?._id || res.data?.id) {
        router.push(`/executions/${res.data._id || res.data.id}`);
      }
    } catch (err) {
      alert(`Failed to trigger execution: ${err.message}`);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Welcome Banner */}
          <div className="glass-panel relative overflow-hidden rounded-2xl p-6 border border-brand-200 dark:border-brand-500/20 bg-gradient-to-r from-brand-50 via-white to-white dark:from-brand-950/40 dark:via-surface-900 dark:to-surface-900 shadow-sm">
            <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                  AI Operations Console
                </h1>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 max-w-xl">
                  Manage autonomous workflows, monitor the 5-agent execution substrate, and streamline multi-platform automations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/workflows/builder"
                  className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-600/20 transition hover:brightness-110"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Generate with AI</span>
                </Link>
                <Link
                  href="/workflows"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-surface-800"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Workflow</span>
                </Link>
                <button
                  onClick={fetchDashboardData}
                  className="rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  title="Refresh Dashboard"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Metric Grid KPIs */}
          <MetricGrid stats={stats} isLoading={isLoading} />

          {/* 2-Column Section: Active Workflows & Recent Executions */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Active Workflows Panel */}
            <div className="glass-panel rounded-xl border border-slate-200 dark:border-surface-800/80 p-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-surface-800 pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">Active Workflows</h3>
                </div>
                <Link href="/workflows" className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
                  <span>View all</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {workflows.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No active workflows found. Click <Link href="/workflows/builder" className="text-brand-600 dark:text-brand-400 underline">Generate with AI</Link> to create one.
                  </div>
                ) : (
                  workflows.map((wf) => (
                    <div
                      key={wf._id || wf.id}
                      className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-surface-800 bg-white/70 dark:bg-surface-850 p-3 transition hover:border-brand-400 dark:hover:border-slate-700 shadow-sm"
                    >
                      <div className="min-w-0 pr-3">
                        <Link href={`/workflows/${wf._id || wf.id}`} className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-300 truncate block">
                          {wf.name}
                        </Link>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {wf.description || 'Custom autonomous automation'}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                          <span className="rounded bg-slate-100 dark:bg-surface-800 px-1.5 py-0.5 font-medium text-slate-600 dark:text-slate-400">
                            {wf.nodes?.length || 0} nodes
                          </span>
                          <span>v{wf.version || 1}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleQuickRun(wf._id || wf.id)}
                        className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand-50 dark:bg-brand-600/20 px-3 py-1.5 text-xs font-bold text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 transition hover:bg-brand-600 hover:text-white"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        <span>Run</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Executions Audit Panel */}
            <div className="glass-panel rounded-xl border border-slate-200 dark:border-surface-800/80 p-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-surface-800 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200">Recent Executions</h3>
                </div>
                <Link href="/executions" className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline">
                  <span>View timeline</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {(!stats?.recentExecutions || stats.recentExecutions.length === 0) ? (
                  <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                    No runs recorded yet. Execute any workflow to view real-time timeline logs.
                  </div>
                ) : (
                  stats.recentExecutions.map((exec) => {
                    const isSuccess = exec.status === 'COMPLETED';
                    const isFail = exec.status === 'FAILED';
                    const isRunning = exec.status === 'RUNNING' || exec.status === 'RETRYING';
                    return (
                      <Link
                        key={exec.id}
                        href={`/executions/${exec.id}`}
                        className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-surface-800 bg-white/70 dark:bg-surface-850 p-3 transition hover:border-brand-400 dark:hover:border-slate-700 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          {isSuccess ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
                          ) : isFail ? (
                            <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400 shrink-0" />
                          ) : (
                            <Activity className="h-4 w-4 text-brand-500 dark:text-brand-400 animate-spin shrink-0" />
                          )}
                          <div>
                            <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {exec.id?.slice(0, 8)}...
                            </span>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                              {exec.createdAt ? new Date(exec.createdAt).toLocaleTimeString() : 'Recent'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              isSuccess
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                : isFail
                                ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300'
                                : isRunning
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300 animate-pulse'
                                : 'bg-slate-100 dark:bg-surface-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {exec.status}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                            {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : '-'}
                          </span>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
