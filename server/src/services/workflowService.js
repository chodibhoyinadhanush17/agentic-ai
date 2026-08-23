import { Workflow } from '../models/Workflow.js';
import { Execution } from '../models/Execution.js';
import { Integration } from '../models/Integration.js';
import aiService from './aiService.js';

export class WorkflowService {
  async getDashboardStats(userId) {
    const workflows = await Workflow.find({ owner: userId });
    const executions = await Execution.find({});
    const integrations = await Integration.find({ owner: userId });

    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter((w) => w.status === 'active').length;
    const totalExecutions = executions.length;
    const completedExecutions = executions.filter((e) => e.status === 'COMPLETED').length;
    const failedExecutions = executions.filter((e) => e.status === 'FAILED').length;
    const runningExecutions = executions.filter((e) => e.status === 'RUNNING' || e.status === 'RETRYING').length;

    const successRate = totalExecutions > 0 ? Number(((completedExecutions / totalExecutions) * 100).toFixed(1)) : 100;

    const recentExecutions = executions.slice(0, 5).map((e) => ({
      id: e._id || e.id,
      workflowId: e.workflowId,
      status: e.status,
      duration: e.duration,
      retryCount: e.retryCount,
      createdAt: e.createdAt,
    }));

    return {
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      completedExecutions,
      failedExecutions,
      runningExecutions,
      successRate,
      connectedIntegrations: integrations.filter((i) => i.isConnected).length,
      recentExecutions,
    };
  }

  async listWorkflows(userId, { search = '', status, tag, page = 1, limit = 20 } = {}) {
    const query = { owner: userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    let workflows = await Workflow.find(query);

    if (search) {
      const s = search.toLowerCase();
      workflows = workflows.filter((w) => w.name?.toLowerCase().includes(s) || w.description?.toLowerCase().includes(s));
    }

    if (tag) {
      workflows = workflows.filter((w) => w.tags && w.tags.includes(tag));
    }

    const total = workflows.length;
    const startIndex = (page - 1) * limit;
    const items = workflows.slice(startIndex, startIndex + limit);

    return {
      items,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async createWorkflow(userId, data) {
    if (!data.name) {
      throw new Error('Workflow name is required');
    }

    const workflow = await Workflow.create({
      name: data.name,
      description: data.description || '',
      owner: userId,
      status: data.status || 'active',
      triggerConfig: data.triggerConfig || { type: 'manual' },
      nodes: data.nodes || [
        {
          id: 'node_trigger',
          type: 'trigger',
          label: 'Manual Trigger',
          position: { x: 100, y: 150 },
          data: { label: 'Manual Trigger', icon: 'Zap' },
          config: { type: 'manual' },
        },
      ],
      edges: data.edges || [],
      tags: data.tags || ['automation'],
      version: 1,
    });

    return workflow;
  }

  async generateFromPrompt(userId, prompt) {
    const generated = await aiService.generateWorkflow(prompt);
    
    // Optionally create workflow in database or return draft object
    const createdWorkflow = await Workflow.create({
      ...generated,
      owner: userId,
      status: 'active',
    });

    return createdWorkflow;
  }

  async getWorkflowById(userId, workflowId) {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }
    return workflow;
  }

  async updateWorkflow(userId, workflowId, updateData) {
    const workflow = await this.getWorkflowById(userId, workflowId);
    
    if (updateData.name) workflow.name = updateData.name;
    if (updateData.description !== undefined) workflow.description = updateData.description;
    if (updateData.status) workflow.status = updateData.status;
    if (updateData.triggerConfig) workflow.triggerConfig = updateData.triggerConfig;
    if (updateData.nodes) workflow.nodes = updateData.nodes;
    if (updateData.edges) workflow.edges = updateData.edges;
    if (updateData.tags) workflow.tags = updateData.tags;
    
    // Increment version number on node/edge topology changes
    if (updateData.nodes || updateData.edges) {
      workflow.version = (workflow.version || 1) + 1;
    }

    await workflow.save();
    return workflow;
  }

  async duplicateWorkflow(userId, workflowId) {
    const original = await this.getWorkflowById(userId, workflowId);
    
    const clone = await Workflow.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      owner: userId,
      status: 'draft',
      triggerConfig: original.triggerConfig,
      nodes: original.nodes,
      edges: original.edges,
      tags: original.tags,
      version: 1,
    });

    return clone;
  }

  async deleteWorkflow(userId, workflowId) {
    await this.getWorkflowById(userId, workflowId);
    return Workflow.findByIdAndDelete(workflowId);
  }
}

export default new WorkflowService();
