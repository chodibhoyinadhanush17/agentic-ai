import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import ProtectedRoute from '../../components/ProtectedRoute/ProtectedRoute.jsx';
import AppShell from '../../components/AppShell/AppShell.jsx';
import WorkflowCanvas from '../../components/WorkflowCanvas/WorkflowCanvas.jsx';
import NodePalette from '../../components/NodePalette/NodePalette.jsx';
import NodeConfigPanel from '../../components/NodeConfigPanel/NodeConfigPanel.jsx';
import { useWorkflowStore } from '../../store/workflowStore.js';
import api from '../../services/api.js';
import {
  Save,
  PlayCircle,
  ChevronLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react';

export default function WorkflowEditorPage() {
  const router = useRouter();
  const { id } = router.query;

  const {
    workflow,
    nodes,
    edges,
    selectedNode,
    setWorkflow,
    setNodes,
    setEdges,
    setSelectedNode,
    addNode,
    saveWorkflow,
    isSaving,
  } = useWorkflowStore();

  const [isLoading, setIsLoading] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchWorkflow = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/workflows/${id}`);
        setWorkflow(res.data);
      } catch (err) {
        alert(`Failed to load workflow: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchWorkflow();
  }, [id, setWorkflow]);

  const onNodesChange = (changes) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  };

  const onEdgesChange = (changes) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  };

  const handleSave = async () => {
    try {
      await saveWorkflow(id);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      await saveWorkflow(id);
      const res = await api.post(`/workflows/${id}/execute`, {});
      if (res.data?._id || res.data?.id) {
        router.push(`/executions/${res.data._id || res.data.id}`);
      }
    } catch (err) {
      alert(`Execution failed: ${err.message}`);
    } finally {
      setIsExecuting(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <AppShell>
          <div className="flex h-[calc(100vh-6.5rem)] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
          </div>
        </AppShell>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <AppShell>
        <div className="flex h-[calc(100vh-6.5rem)] flex-col overflow-hidden rounded-xl border border-slate-200 dark:border-surface-800 bg-white dark:bg-surface-950 shadow-sm">
          {/* Top Canvas Toolbar */}
          <div className="flex h-14 items-center justify-between border-b border-slate-200 dark:border-surface-800 bg-slate-50/90 dark:bg-surface-900/80 px-4 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Link
                href="/workflows"
                className="rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-surface-800 hover:text-slate-800 dark:hover:text-slate-200"
                title="Back to workflows"
              >
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-xs">{workflow?.name}</h2>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                  <span>Version {workflow?.version || 1}</span>
                  <span>•</span>
                  <span>{nodes.length} Nodes</span>
                  <span>•</span>
                  <span>{edges.length} Connections</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {saveSuccess && (
                <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Saved</span>
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-surface-700 bg-white dark:bg-surface-850 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-surface-800 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Save</span>
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:opacity-50"
              >
                {isExecuting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <PlayCircle className="h-3.5 w-3.5" />
                )}
                <span>Run Flow</span>
              </button>
            </div>
          </div>

          {/* Canvas Workspace Layout */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Drag & Drop Palette */}
            <NodePalette />

            {/* Main Interactive Flow Canvas */}
            <div className="flex-1 h-full relative bg-slate-100 dark:bg-surface-950">
              <WorkflowCanvas
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                setEdges={setEdges}
                onNodeClick={(node) => setSelectedNode(node)}
                onDropNode={(nodeData) => addNode(nodeData)}
              />
            </div>

            {/* Right Properties Inspector */}
            {selectedNode && <NodeConfigPanel />}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
