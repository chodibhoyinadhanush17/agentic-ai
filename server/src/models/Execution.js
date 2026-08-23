import mongoose from 'mongoose';
import { inMemoryStore, getDBStatus } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const executionSchema = new mongoose.Schema(
  {
    workflowId: {
      type: String,
      required: true,
      index: true,
    },
    workflowSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'PAUSED', 'CANCELLED'],
      default: 'PENDING',
    },
    currentNode: {
      type: String,
      default: null,
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    inputs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    outputs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    error: {
      code: { type: String, default: null },
      message: { type: String, default: null },
      details: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseExecution = mongoose.model('Execution', executionSchema);

class InMemoryExecution {
  static async find(query = {}) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseExecution.find(query).sort({ createdAt: -1 });
    }
    const results = [];
    for (const item of inMemoryStore.executions.values()) {
      let match = true;
      if (query.workflowId && item.workflowId.toString() !== query.workflowId.toString()) match = false;
      if (query.status && item.status !== query.status) match = false;
      if (query._id && item._id.toString() !== query._id.toString()) match = false;
      if (match) results.push(this.wrapExecution(item));
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async findById(id) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseExecution.findById(id);
    }
    const item = inMemoryStore.executions.get(id.toString());
    return item ? this.wrapExecution(item) : null;
  }

  static async findOne(query) {
    const list = await this.find(query);
    return list.length > 0 ? list[0] : null;
  }

  static async create(data) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseExecution.create(data);
    }
    const id = uuidv4();
    const newExecution = {
      _id: id,
      id: id,
      workflowId: data.workflowId ? data.workflowId.toString() : 'workflow_id',
      workflowSnapshot: data.workflowSnapshot || {},
      status: data.status || 'PENDING',
      currentNode: data.currentNode || null,
      startTime: data.startTime || new Date(),
      endTime: data.endTime || null,
      duration: data.duration || 0,
      inputs: data.inputs || {},
      outputs: data.outputs || {},
      error: data.error || { code: null, message: null, details: null },
      retryCount: data.retryCount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryStore.executions.set(id, newExecution);
    return this.wrapExecution(newExecution);
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseExecution.findByIdAndUpdate(id, update, options);
    }
    const existing = inMemoryStore.executions.get(id.toString());
    if (!existing) return null;
    const updated = { ...existing, ...update, updatedAt: new Date() };
    inMemoryStore.executions.set(id.toString(), updated);
    return this.wrapExecution(updated);
  }

  static async countDocuments(query = {}) {
    const list = await this.find(query);
    return list.length;
  }

  static wrapExecution(raw) {
    return {
      ...raw,
      _id: raw._id,
      id: raw._id,
      save: async function () {
        this.updatedAt = new Date();
        inMemoryStore.executions.set(this._id.toString(), { ...this });
        return this;
      },
      toObject: function () {
        return { ...this };
      },
    };
  }
}

export const Execution = new Proxy(MongooseExecution, {
  get(target, prop) {
    const status = getDBStatus();
    if (status.isInMemoryFallback) {
      if (prop in InMemoryExecution) {
        return InMemoryExecution[prop].bind(InMemoryExecution);
      }
    }
    return target[prop];
  },
});

export default Execution;
