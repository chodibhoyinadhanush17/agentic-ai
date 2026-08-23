import { Execution } from '../models/Execution.js';
import { ExecutionLog } from '../models/ExecutionLog.js';
import { Workflow } from '../models/Workflow.js';
import { addExecutionJob } from '../queues/executionQueue.js';
import orchestrator from '../agents/orchestrator.js';

export class ExecutionService {
  async triggerExecution(userId, workflowId, inputs = {}) {
    const workflow = await Workflow.findById(workflowId);
    if (!workflow) {
      const err = new Error('Workflow not found');
      err.statusCode = 404;
      throw err;
    }

    // Take immutable snapshot of the workflow graph
    const workflowSnapshot = {
      _id: workflow._id || workflow.id,
      name: workflow.name,
      description: workflow.description,
      triggerConfig: workflow.triggerConfig,
      nodes: JSON.parse(JSON.stringify(workflow.nodes || [])),
      edges: JSON.parse(JSON.stringify(workflow.edges || [])),
      version: workflow.version,
    };

    const execution = await Execution.create({
      workflowId: workflow._id || workflow.id,
      workflowSnapshot,
      status: 'PENDING',
      inputs,
      outputs: {},
      retryCount: 0,
      startTime: new Date(),
    });

    const executionId = execution._id || execution.id;

    // Queue for background processing with BullMQ / In-Memory worker
    await addExecutionJob(executionId, userId);

    return execution;
  }

  async listExecutions({ workflowId, status, page = 1, limit = 20 } = {}) {
    const query = {};
    if (workflowId) query.workflowId = workflowId;
    if (status && status !== 'all') query.status = status;

    const executions = await Execution.find(query);
    const total = executions.length;
    const startIndex = (page - 1) * limit;
    const items = executions.slice(startIndex, startIndex + limit);

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

  async getExecutionById(executionId) {
    const execution = await Execution.findById(executionId);
    if (!execution) {
      const err = new Error('Execution run not found');
      err.statusCode = 404;
      throw err;
    }
    return execution;
  }

  async getExecutionTimeline(executionId) {
    const execution = await this.getExecutionById(executionId);
    const logs = await ExecutionLog.find({ executionId });
    return {
      execution,
      timeline: logs,
      langGraph: orchestrator.getLangGraphStatus(),
    };
  }

  async pauseExecution(executionId) {
    const execution = await this.getExecutionById(executionId);
    const success = orchestrator.pauseExecution(executionId);
    if (success) {
      execution.status = 'PAUSED';
      await execution.save();
    }
    return { success, status: execution.status };
  }

  async resumeExecution(executionId) {
    const execution = await this.getExecutionById(executionId);
    const success = orchestrator.resumeExecution(executionId);
    if (success) {
      execution.status = 'RUNNING';
      await execution.save();
    }
    return { success, status: execution.status };
  }

  async cancelExecution(executionId) {
    const execution = await this.getExecutionById(executionId);
    const success = orchestrator.cancelExecution(executionId);
    if (success) {
      execution.status = 'CANCELLED';
      execution.endTime = new Date();
      await execution.save();
    }
    return { success, status: execution.status };
  }
}

export default new ExecutionService();
