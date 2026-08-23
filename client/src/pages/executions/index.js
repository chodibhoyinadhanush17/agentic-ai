import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute.jsx';
import AppShell from '../../components/AppShell/AppShell.jsx';
import { getSocket } from '../../services/socket.js';
import api from '../../services/api.js';
import {
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

export default function ExecutionsListPage() {
  const [executions, setExecutions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchExecutions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/executions', {
        params: { status: statusFilter !== 'all' ? statusFilter : undefined },
      });
      setExecutions(res.data?.items || []);
    } catch (err) {
      console.warn('[ExecutionsList] Fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions();

    const socket = getSocket();
    if (socket) {
      const handleExecutionUpdate = (update) => {
        setExecutions((prev) => {
          const index = prev.findIndex((e) => (e._id || e.id) === (update.executionId || update.id));
          if (index !== -1) {
            const updated = [...prev];
            updated[index] = { ...updated[index], ...update };
            return updated;
          }
          return [update, ...prev];
        });
      };

      socket.on('execution:update', handleExecutionUpdate);
      return () => socket.off('execution:update', handleExecutionUpdate);
    }
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-bold">COMPLETED</span>;
      case 'RUNNING':
        return <span className="rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-bold animate-pulse">RUNNING</span>;
      case 'FAILED':
        return <span className="rounded-full bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300 px-2.5 py-0.5 text-xs font-bold">FAILED</span>;
      case 'PAUSED':
        return <span className="rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 px-2.5 py-0.5 text-xs font-bold">PAUSED</span>;
      case 'CANCELLED':
        return <span className="rounded-full bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-400 px-2.5 py-0.5 text-xs font-bold">CANCELLED</span>;
      case 'RETRYING':
        return <span className="rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300 px-2.5 py-0.5 text-xs font-bold animate-pulse">RETRYING</span>;
      default:
        return <span className="rounded-full bg-slate-100 dark:bg-surface-800 px-2.5 py-0.5 text-xs font-bold text-slate-500 dark:text-slate-400">PENDING</span>;
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Execution Audit & Runs</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Inspect historical runs, live WebSocket agent telemetry, and multi-agent execution timelines.
              </p>
            </div>

            <button
              onClick={fetchExecutions}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-800 shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:border-brand-500 focus:outline-none shadow-sm"
              >
                <option value="all">All States</option>
                <option value="COMPLETED">Completed</option>
                <option value="RUNNING">Running</option>
                <option value="FAILED">Failed</option>
                <option value="PAUSED">Paused</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Executions Table */}
          <div className="glass-panel overflow-hidden rounded-xl border border-slate-200 dark:border-surface-800 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-surface-800 bg-slate-50 dark:bg-surface-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Execution ID</th>
                    <th className="px-5 py-3.5">Workflow Name</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Duration</th>
                    <th className="px-5 py-3.5">Retries</th>
                    <th className="px-5 py-3.5">Timestamp</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-surface-800/60 bg-white/60 dark:bg-surface-950/40">
                  {isLoading ? (
                    [1, 2, 3, 4].map((i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={7} className="h-12 px-5 bg-slate-100 dark:bg-surface-900/30" />
                      </tr>
                    ))
                  ) : executions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                        No execution records found.
                      </td>
                    </tr>
                  ) : (
                    executions.map((exec) => {
                      const id = exec._id || exec.id;
                      const wfName = exec.workflowSnapshot?.name || 'Workflow Run';
                      return (
                        <tr key={id} className="transition hover:bg-slate-50 dark:hover:bg-surface-850/60">
                          <td className="px-5 py-4 font-mono font-semibold text-brand-600 dark:text-brand-400">
                            {id?.slice(0, 12)}...
                          </td>
                          <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">{wfName}</td>
                          <td className="px-5 py-4">{getStatusBadge(exec.status)}</td>
                          <td className="px-5 py-4 font-mono text-slate-600 dark:text-slate-300">
                            {exec.duration ? `${(exec.duration / 1000).toFixed(2)}s` : '-'}
                          </td>
                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{exec.retryCount || 0}</td>
                          <td className="px-5 py-4 text-slate-500 dark:text-slate-400">
                            {exec.createdAt ? new Date(exec.createdAt).toLocaleString() : '-'}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <Link
                              href={`/executions/${id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300 hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-surface-800 shadow-sm"
                            >
                              <span>Timeline</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
