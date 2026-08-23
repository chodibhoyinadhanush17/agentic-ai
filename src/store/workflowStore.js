import { create } from 'zustand';
import api from '../services/api.js';

export const useWorkflowStore = create((set, get) => ({
  // Workflow Editor State
  workflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  isSaving: false,
  isLoading: false,
  error: null,

  // Live Execution State
  activeExecution: null,
  executionLogs: [],
  executionStatus: null,

  // Notifications State
  notifications: [],
  unreadCount: 0,

  setWorkflow: (workflow) => {
    set({
      workflow,
      nodes: workflow?.nodes || [],
      edges: workflow?.edges || [],
      selectedNode: null,
    });
  },

  setNodes: (nodes) => {
    set((state) => ({
      nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes,
    }));
  },

  setEdges: (edges) => {
    set((state) => ({
      edges: typeof edges === 'function' ? edges(state.edges) : edges,
    }));
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  addNode: (nodeData) => {
    const id = `node_${Date.now()}`;
    const newNode = {
      id,
      type: nodeData.type || 'ai_agent',
      label: nodeData.label || 'New Node',
      position: nodeData.position || { x: 250, y: 200 },
      data: {
        label: nodeData.label || 'New Node',
        icon: nodeData.icon || 'Bot',
        description: nodeData.description || '',
        ...nodeData.data,
      },
      config: nodeData.config || {},
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNode: newNode,
    }));
  },

  updateNodeConfig: (nodeId, newConfig, newLabel = null) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          const updated = {
            ...node,
            config: { ...node.config, ...newConfig },
            data: { ...node.data, ...(newLabel ? { label: newLabel } : {}) },
          };
          if (newLabel) updated.label = newLabel;
          return updated;
        }
        return node;
      }),
      selectedNode: state.selectedNode?.id === nodeId
        ? {
            ...state.selectedNode,
            config: { ...state.selectedNode.config, ...newConfig },
            data: { ...state.selectedNode.data, ...(newLabel ? { label: newLabel } : {}) },
            ...(newLabel ? { label: newLabel } : {}),
          }
        : state.selectedNode,
    }));
  },

  deleteNode: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== nodeId),
      edges: state.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
    }));
  },

  saveWorkflow: async (workflowId) => {
    set({ isSaving: true, error: null });
    const { workflow, nodes, edges } = get();
    try {
      const payload = {
        name: workflow?.name,
        description: workflow?.description,
        status: workflow?.status,
        triggerConfig: workflow?.triggerConfig,
        nodes,
        edges,
        tags: workflow?.tags,
      };

      const res = await api.put(`/workflows/${workflowId}`, payload);
      set({ workflow: res.data, isSaving: false });
      return res.data;
    } catch (err) {
      set({ isSaving: false, error: err.message });
      throw err;
    }
  },

  // Real-Time Execution Tracking
  setActiveExecution: (execution) => set({ activeExecution: execution, executionStatus: execution?.status || null }),
  
  setExecutionLogs: (logs) => set({ executionLogs: logs }),

  addLiveLog: (log) => {
    set((state) => {
      // Avoid duplicate logs
      if (state.executionLogs.some((l) => (l.id && l.id === log.id) || (l._id && l._id === log._id))) {
        return state;
      }
      return { executionLogs: [...state.executionLogs, log] };
    });
  },

  setExecutionStatus: (status) => set({ executionStatus: status }),

  // Notifications
  setNotifications: (notifications) => {
    const unread = notifications.filter((n) => !n.isRead).length;
    set({ notifications, unreadCount: unread });
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAllNotificationsRead: async () => {
    try {
      await api.post('/notifications/mark-read', {});
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.warn('[WorkflowStore] Mark read failed:', err.message);
    }
  },
}));

export default useWorkflowStore;
