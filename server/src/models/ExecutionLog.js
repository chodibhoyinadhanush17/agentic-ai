import mongoose from 'mongoose';
import { inMemoryStore, getDBStatus } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const executionLogSchema = new mongoose.Schema(
  {
    executionId: {
      type: String,
      required: true,
      index: true,
    },
    workflowId: {
      type: String,
      required: true,
    },
    nodeId: {
      type: String,
      default: null,
    },
    agent: {
      type: String,
      enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring'],
      required: true,
    },
    level: {
      type: String,
      enum: ['info', 'warning', 'error', 'success'],
      default: 'info',
    },
    message: {
      type: String,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseExecutionLog = mongoose.model('ExecutionLog', executionLogSchema);

class InMemoryExecutionLog {
  static async find(query = {}) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseExecutionLog.find(query).sort({ timestamp: 1 });
    }
    const results = inMemoryStore.executionLogs.filter((item) => {
      if (query.executionId && item.executionId.toString() !== query.executionId.toString()) return false;
      if (query.workflowId && item.workflowId.toString() !== query.workflowId.toString()) return false;
      if (query.agent && item.agent !== query.agent) return false;
      return true;
    });
    return results.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  static async create(data) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseExecutionLog.create(data);
    }
    const id = uuidv4();
    const newLog = {
      _id: id,
      id: id,
      executionId: data.executionId ? data.executionId.toString() : 'exec_id',
      workflowId: data.workflowId ? data.workflowId.toString() : 'wf_id',
      nodeId: data.nodeId || null,
      agent: data.agent,
      level: data.level || 'info',
      message: data.message,
      metadata: data.metadata || {},
      timestamp: data.timestamp || new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryStore.executionLogs.push(newLog);
    return newLog;
  }
}

export const ExecutionLog = new Proxy(MongooseExecutionLog, {
  get(target, prop) {
    const status = getDBStatus();
    if (status.isInMemoryFallback) {
      if (prop in InMemoryExecutionLog) {
        return InMemoryExecutionLog[prop].bind(InMemoryExecutionLog);
      }
    }
    return target[prop];
  },
});

export default ExecutionLog;
