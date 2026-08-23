import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute.jsx';
import AppShell from '../../components/AppShell/AppShell.jsx';
import { getSocket, joinExecutionRoom, leaveExecutionRoom } from '../../services/socket.js';
import api from '../../services/api.js';
import {
  Play,
  Pause,
  StopCircle,
  ChevronLeft,
  Terminal,
  Cpu,
  Info,
} from 'lucide-react';

const agentStyles = {
  planner: {
    badge: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/20 dark:text-sky-300 dark:border-sky-500/30',
    dot: 'bg-sky-500 dark:bg-sky-400',
    name: 'Planner Agent',
  },
  execution: {
    badge: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
    dot: 'bg-indigo-500 dark:bg-indigo-400',
    name: 'Execution Agent',
  },
  validation: {
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
    dot: 'bg-emerald-500 dark:bg-emerald-400',
    name: 'Validation Agent',
  },
  recovery: {
    badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
    dot: 'bg-amber-500 dark:bg-amber-400',
    name: 'Recovery Agent',
  },
  monitoring: {
    badge: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
    dot: 'bg-purple-500 dark:bg-purple-400',
    name: 'Monitoring Agent',
  },
};

export default function ExecutionDetailsPage() {
  const router = useRouter();
  const { id } = router.query;
  const logsEndRef = useRef(null);

  const [execution, setExecution] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [langGraph, setLangGraph] = useState('not-installed');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTimeline = async () => {
    if (!id) return;
    try {
      const res = await api.get(`/executions/${id}/timeline`);
      setExecution(res.data?.execution);
      setTimeline(res.data?.timeline || []);
      setLangGraph(res.data?.langGraph || 'not-installed');
    } catch (err) {
      console.warn('[ExecutionDetails] Fetch error:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();

    if (id) {
      joinExecutionRoom(id);

      const socket = getSocket();
      if (socket) {
        const onAgentEvent = (evt) => {
          setTimeline((prev) => [...prev, evt]);
        };

        const onExecutionStatus = (statusData) => {
          setExecution((prev) => (prev ? { ...prev, ...statusData } : prev));
        };

        socket.on('agent:event', onAgentEvent);
        socket.on('execution:status', onExecutionStatus);

        return () => {
          leaveExecutionRoom(id);
          socket.off('agent:event', onAgentEvent);
          socket.off('execution:status', onExecutionStatus);
        };
      }
    }
  }, [id]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [timeline]);

  const handlePause = async () => {
    setActionLoading(true);
    try {
      await api.post(`/executions/${id}/pause`, {});
      fetchTimeline();
    } catch (err) {
      alert(`Pause failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    setActionLoading(true);
    try {
      await api.post(`/executions/${id}/resume`, {});
      fetchTimeline();
    } catch (err) {
      alert(`Resume failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this running execution?')) return;
    setActionLoading(true);
    try {
      await api.post(`/executions/${id}/cancel`, {});
      fetchTimeline();
    } catch (err) {
      alert(`Cancel failed: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const isRunning = execution?.status === 'RUNNING' || execution?.status === 'RETRYING';
  const isPaused = execution?.status === 'PAUSED';

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-surface-800 pb-5">
            <div className="flex items-center gap-3">
              <Link
                href="/executions"
                className="rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-surface-800 shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">Execution Run</h1>
                  <span className="font-mono text-xs text-brand-600 dark:text-brand-400">#{String(id).slice(0, 10)}</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Workflow: <span className="text-slate-800 dark:text-slate-200 font-semibold">{execution?.workflowSnapshot?.name || 'Automation'}</span>
                </p>
              </div>
            </div>

            {/* Lifecycle Controls */}
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 dark:bg-surface-850 border border-slate-200 dark:border-surface-800 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 font-medium">
                Substrate: <strong className="text-brand-700 dark:text-brand-300">LangGraph [{langGraph}]</strong>
              </span>

              {isRunning && (
                <>
                  <button
                    onClick={handlePause}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20"
                  >
                    <Pause className="h-3.5 w-3.5" />
                    <span>Pause</span>
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={actionLoading}
                    className="flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-500/20"
                  >
                    <StopCircle className="h-3.5 w-3.5" />
                    <span>Cancel</span>
                  </button>
                </>
              )}

              {isPaused && (
                <button
                  onClick={handleResume}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Resume</span>
                </button>
              )}
            </div>
          </div>

          {/* Execution Status Card Banner */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="glass-panel rounded-xl p-4 border border-slate-200 dark:border-surface-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Current Status</span>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    execution?.status === 'COMPLETED'
                      ? 'bg-emerald-500'
                      : execution?.status === 'FAILED'
                      ? 'bg-red-500'
                      : isRunning
                      ? 'bg-indigo-500 animate-pulse'
                      : 'bg-amber-500'
                  }`}
                />
                <span className="text-sm font-bold text-slate-900 dark:text-white">{execution?.status || 'PENDING'}</span>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-slate-200 dark:border-surface-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Duration</span>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
                {execution?.duration ? `${(execution.duration / 1000).toFixed(2)}s` : isRunning ? 'In flight...' : '-'}
              </p>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-slate-200 dark:border-surface-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Retry Count</span>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">{execution?.retryCount || 0} attempts</p>
            </div>

            <div className="glass-panel rounded-xl p-4 border border-slate-200 dark:border-surface-800">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Agent Events</span>
              <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">{timeline.length} events streamed</p>
            </div>
          </div>

          {/* 2-Column Section: Real-Time Timeline & Output Payloads */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Real-Time Agent Events Timeline */}
            <div className="glass-panel flex flex-col rounded-xl border border-slate-200 dark:border-surface-800 lg:col-span-2 overflow-hidden shadow-sm">
              <div className="flex h-12 items-center justify-between border-b border-slate-200 dark:border-surface-800 bg-slate-50/90 dark:bg-surface-900/90 px-4">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Live Multi-Agent Timeline
                  </h3>
                </div>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  <span>Streaming Live</span>
                </span>
              </div>

              <div className="h-[480px] overflow-y-auto p-4 space-y-4 font-mono text-xs bg-slate-50/50 dark:bg-transparent">
                {timeline.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-500">
                    Waiting for agent events to stream...
                  </div>
                ) : (
                  timeline.map((evt, idx) => {
                    const agentCfg = agentStyles[evt.agent] || agentStyles.monitoring;
                    const isErr = evt.level === 'error';
                    const isSuccess = evt.level === 'success';
                    const isWarn = evt.level === 'warning';
                    return (
                      <div key={idx} className="flex items-start gap-3 text-left">
                        {/* Agent Marker */}
                        <div className="flex flex-col items-center">
                          <span className={`h-2.5 w-2.5 rounded-full ${agentCfg.dot} mt-1`} />
                          <span className="h-full w-0.5 bg-slate-200 dark:bg-surface-800 my-1" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 rounded-lg border border-slate-200 dark:border-surface-800/80 bg-white dark:bg-surface-900/60 p-3 shadow-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${agentCfg.badge}`}>
                              {agentCfg.name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              {evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString() : ''}
                            </span>
                          </div>

                          <p
                            className={`mt-2 font-sans text-xs ${
                              isErr
                                ? 'text-red-600 dark:text-red-400'
                                : isSuccess
                                ? 'text-emerald-700 dark:text-emerald-300 font-medium'
                                : isWarn
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {evt.message}
                          </p>

                          {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                            <div className="mt-2 rounded bg-slate-100 dark:bg-surface-950/80 p-2 text-[10px] text-slate-600 dark:text-slate-400 overflow-x-auto border border-slate-200 dark:border-transparent">
                              <pre>{JSON.stringify(evt.metadata, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </div>

            {/* Downstream Outputs & Context Inspector */}
            <div className="glass-panel flex flex-col rounded-xl border border-slate-200 dark:border-surface-800 overflow-hidden shadow-sm">
              <div className="flex h-12 items-center gap-2 border-b border-slate-200 dark:border-surface-800 bg-slate-50/90 dark:bg-surface-900/90 px-4">
                <Cpu className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Execution Payload Outputs
                </h3>
              </div>

              <div className="h-[480px] overflow-y-auto p-4 font-mono text-xs bg-slate-50/50 dark:bg-transparent">
                {execution?.outputs && Object.keys(execution.outputs).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(execution.outputs).map(([nodeId, out]) => (
                      <div key={nodeId} className="rounded-lg border border-slate-200 dark:border-surface-800 bg-white dark:bg-surface-900 p-3 shadow-sm">
                        <div className="text-[11px] font-bold text-brand-600 dark:text-brand-300 mb-1">{nodeId}</div>
                        <pre className="text-[10px] text-slate-600 dark:text-slate-400 overflow-x-auto whitespace-pre-wrap">
                          {JSON.stringify(out, null, 2)}
                        </pre>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500">
                    <Info className="h-6 w-6 mb-2 opacity-40" />
                    <p>No final outputs yet.</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-1">
                      Payloads will appear as nodes complete execution.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
