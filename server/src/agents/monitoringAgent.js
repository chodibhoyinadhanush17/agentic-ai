import { ExecutionLog } from '../models/ExecutionLog.js';
import { Notification } from '../models/Notification.js';
import { emitAgentEvent, emitExecutionStatus, emitNotification } from '../config/socket.js';

export class MonitoringAgent {
  constructor() {
    this.name = 'monitoring';
  }

  /**
   * Records a granular multi-agent event, streams it via Socket.IO, and logs to database
   */
  async recordEvent({ executionId, workflowId, nodeId = null, agent, level = 'info', message, metadata = {}, userId = null }) {
    // 1. Persist to ExecutionLog
    const log = await ExecutionLog.create({
      executionId,
      workflowId,
      nodeId,
      agent,
      level,
      message,
      metadata,
      timestamp: new Date(),
    });

    // 2. Broadcast live event via Socket.IO
    emitAgentEvent(executionId, agent, {
      id: log._id || log.id,
      nodeId,
      level,
      message,
      metadata,
      timestamp: log.timestamp || new Date().toISOString(),
    });

    // 3. If event is critical error or completion notification, save and broadcast system notification
    if (level === 'error' && userId) {
      const notification = await Notification.create({
        owner: userId,
        workflowId,
        executionId,
        type: 'error',
        title: `Workflow Execution Error [${agent.toUpperCase()}]`,
        message: message.slice(0, 160),
      });
      emitNotification(userId, notification);
    }

    return log;
  }

  /**
   * Broadcasts status changes (RUNNING, PAUSED, CANCELLED, COMPLETED, FAILED)
   */
  async updateStatus(executionId, workflowId, status, duration = 0, error = null, userId = null) {
    emitExecutionStatus(executionId, {
      workflowId,
      status,
      duration,
      error,
    });

    if (status === 'COMPLETED' && userId) {
      const notif = await Notification.create({
        owner: userId,
        workflowId,
        executionId,
        type: 'success',
        title: 'Workflow Execution Completed',
        message: `Execution ${executionId} completed successfully in ${(duration / 1000).toFixed(2)}s.`,
      });
      emitNotification(userId, notif);
    }
  }
}

export default new MonitoringAgent();
