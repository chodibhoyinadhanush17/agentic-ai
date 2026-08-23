import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute.jsx';
import AppShell from '../../components/AppShell/AppShell.jsx';
import api from '../../services/api.js';
import {
  Workflow,
  Sparkles,
  Plus,
  PlayCircle,
  Copy,
  Trash2,
  Search,
  Layers,
  Loader2,
} from 'lucide-react';

export default function WorkflowsListPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const fetchWorkflows = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/workflows', {
        params: { search, status: statusFilter !== 'all' ? statusFilter : undefined },
      });
      setWorkflows(res.data?.items || []);
    } catch (err) {
      console.warn('[WorkflowsList] Error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [search, statusFilter]);

  const handleCreateManual = async () => {
    setIsCreating(true);
    try {
      const res = await api.post('/workflows', {
        name: `New Workflow ${new Date().toLocaleDateString()}`,
        description: 'Visual workflow created manually',
        status: 'draft',
      });
      if (res.data?._id || res.data?.id) {
        router.push(`/workflows/${res.data._id || res.data.id}`);
      }
    } catch (err) {
      alert(`Create failed: ${err.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/workflows/${id}/duplicate`);
      fetchWorkflows();
    } catch (err) {
      alert(`Duplicate failed: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      fetchWorkflows();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleExecute = async (id) => {
    try {
      const res = await api.post(`/workflows/${id}/execute`, {});
      if (res.data?._id || res.data?.id) {
        router.push(`/executions/${res.data._id || res.data.id}`);
      }
    } catch (err) {
      alert(`Execution trigger failed: ${err.message}`);
    }
  };

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Workflows Studio</h1>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Design, version, and manage visual multi-agent workflows.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/workflows/builder"
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-brand-600/20 transition hover:brightness-110"
              >
                <Sparkles className="h-4 w-4" />
                <span>AI Prompt Generator</span>
              </Link>
              <button
                onClick={handleCreateManual}
                disabled={isCreating}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-surface-800 disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                <span>Blank Canvas</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search workflows by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-900 py-2 pl-9 pr-3 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:border-brand-500 focus:outline-none shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-900 px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:border-brand-500 focus:outline-none shadow-sm"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          {/* Workflow Cards Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-panel h-48 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 text-center">
              <Workflow className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-600" />
              <h3 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">No workflows found</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Get started by generating a workflow with natural language or creating a blank canvas.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/workflows/builder"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-500"
                >
                  Generate with AI
                </Link>
                <button
                  onClick={handleCreateManual}
                  className="rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-surface-800"
                >
                  Create Manually
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflows.map((wf) => (
                <div
                  key={wf._id || wf.id}
                  className="glass-panel flex flex-col justify-between rounded-xl border border-slate-200 dark:border-surface-800/90 p-5 transition-all duration-200 hover:border-brand-400 dark:hover:border-slate-600 hover:shadow-lg"
                >
                  <div>
                    {/* Top Row: Status badge & Version */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          wf.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                            : wf.status === 'draft'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-surface-800 dark:text-slate-400'
                        }`}
                      >
                        {wf.status || 'active'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">v{wf.version || 1}</span>
                    </div>

                    {/* Name & Description */}
                    <Link
                      href={`/workflows/${wf._id || wf.id}`}
                      className="mt-3 block text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-300 truncate"
                    >
                      {wf.name}
                    </Link>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {wf.description || 'Custom autonomous multi-agent automation.'}
                    </p>

                    {/* Tags & Node Count */}
                    <div className="mt-4 flex flex-wrap items-center gap-1.5">
                      <span className="flex items-center gap-1 rounded bg-slate-100 dark:bg-surface-800 px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                        <Layers className="h-3 w-3 text-brand-600 dark:text-brand-400" />
                        {wf.nodes?.length || 0} Nodes
                      </span>
                      {wf.tags?.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 text-[10px] text-indigo-700 dark:text-indigo-300 font-medium"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-6 flex items-center justify-between border-t border-slate-200 dark:border-surface-800/80 pt-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDuplicate(wf._id || wf.id)}
                        className="rounded p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800 hover:text-slate-800 dark:hover:text-slate-200"
                        title="Duplicate workflow"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(wf._id || wf.id)}
                        className="rounded p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800 hover:text-red-500 dark:hover:text-red-400"
                        title="Delete workflow"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/workflows/${wf._id || wf.id}`}
                        className="rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-surface-800"
                      >
                        Canvas
                      </Link>
                      <button
                        onClick={() => handleExecute(wf._id || wf.id)}
                        className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-brand-500"
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        <span>Run</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
