import mongoose from 'mongoose';
import { inMemoryStore, getDBStatus } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const agentMemorySchema = new mongoose.Schema(
  {
    workflowId: {
      type: String,
      required: true,
      index: true,
    },
    executionId: {
      type: String,
      required: true,
      index: true,
    },
    agentId: {
      type: String,
      enum: ['planner', 'execution', 'validation', 'recovery', 'monitoring'],
      required: true,
    },
    key: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    confidenceScore: {
      type: Number,
      default: 1.0,
      min: 0,
      max: 1,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseAgentMemory = mongoose.model('AgentMemory', agentMemorySchema);

class InMemoryAgentMemory {
  static async find(query = {}) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseAgentMemory.find(query);
    }
    const results = [];
    for (const item of inMemoryStore.agentMemories.values()) {
      let match = true;
      if (query.executionId && item.executionId.toString() !== query.executionId.toString()) match = false;
      if (query.agentId && item.agentId !== query.agentId) match = false;
      if (query.key && item.key !== query.key) match = false;
      if (match) results.push({ ...item });
    }
    return results;
  }

  static async create(data) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseAgentMemory.create(data);
    }
    const id = uuidv4();
    const newMemory = {
      _id: id,
      id: id,
      workflowId: data.workflowId ? data.workflowId.toString() : 'wf_id',
      executionId: data.executionId ? data.executionId.toString() : 'exec_id',
      agentId: data.agentId,
      key: data.key,
      value: data.value,
      confidenceScore: data.confidenceScore !== undefined ? data.confidenceScore : 1.0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryStore.agentMemories.set(id, newMemory);
    return newMemory;
  }
}

export const AgentMemory = new Proxy(MongooseAgentMemory, {
  get(target, prop) {
    const status = getDBStatus();
    if (status.isInMemoryFallback) {
      if (prop in InMemoryAgentMemory) {
        return InMemoryAgentMemory[prop].bind(InMemoryAgentMemory);
      }
    }
    return target[prop];
  },
});

export default AgentMemory;
