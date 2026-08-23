import mongoose from 'mongoose';
import { inMemoryStore, getDBStatus } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const workflowSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Workflow name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    owner: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'archived'],
      default: 'active',
    },
    triggerConfig: {
      type: {
        type: String,
        enum: ['manual', 'schedule', 'webhook', 'event', 'integration'],
        default: 'manual',
      },
      schedule: { type: String, default: '' },
      webhookPath: { type: String, default: '' },
      config: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    nodes: [
      {
        id: { type: String, required: true },
        type: { type: String, required: true },
        label: { type: String, default: '' },
        position: {
          x: { type: Number, default: 0 },
          y: { type: Number, default: 0 },
        },
        data: { type: mongoose.Schema.Types.Mixed, default: {} },
        config: { type: mongoose.Schema.Types.Mixed, default: {} },
      },
    ],
    edges: [
      {
        id: { type: String, required: true },
        source: { type: String, required: true },
        target: { type: String, required: true },
        sourceHandle: { type: String, default: null },
        targetHandle: { type: String, default: null },
        label: { type: String, default: '' },
        animated: { type: Boolean, default: true },
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const MongooseWorkflow = mongoose.model('Workflow', workflowSchema);

class InMemoryWorkflow {
  static async find(query = {}) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseWorkflow.find(query);
    }
    const results = [];
    for (const item of inMemoryStore.workflows.values()) {
      let match = true;
      if (query.owner && item.owner.toString() !== query.owner.toString()) match = false;
      if (query.status && item.status !== query.status) match = false;
      if (query._id && item._id.toString() !== query._id.toString()) match = false;
      if (match) results.push(this.wrapWorkflow(item));
    }
    return results;
  }

  static async findById(id) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseWorkflow.findById(id);
    }
    const item = inMemoryStore.workflows.get(id.toString());
    return item ? this.wrapWorkflow(item) : null;
  }

  static async findOne(query) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseWorkflow.findOne(query);
    }
    const list = await this.find(query);
    return list.length > 0 ? list[0] : null;
  }

  static async create(data) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseWorkflow.create(data);
    }
    const id = uuidv4();
    const newWorkflow = {
      _id: id,
      id: id,
      name: data.name,
      description: data.description || '',
      owner: data.owner ? data.owner.toString() : 'system',
      status: data.status || 'active',
      triggerConfig: data.triggerConfig || { type: 'manual' },
      nodes: data.nodes || [],
      edges: data.edges || [],
      version: data.version || 1,
      tags: data.tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryStore.workflows.set(id, newWorkflow);
    return this.wrapWorkflow(newWorkflow);
  }

  static async findByIdAndUpdate(id, update, options = {}) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseWorkflow.findByIdAndUpdate(id, update, options);
    }
    const existing = inMemoryStore.workflows.get(id.toString());
    if (!existing) return null;
    const updated = { ...existing, ...update, updatedAt: new Date() };
    inMemoryStore.workflows.set(id.toString(), updated);
    return this.wrapWorkflow(updated);
  }

  static async findByIdAndDelete(id) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseWorkflow.findByIdAndDelete(id);
    }
    const existing = inMemoryStore.workflows.get(id.toString());
    if (existing) {
      inMemoryStore.workflows.delete(id.toString());
      return this.wrapWorkflow(existing);
    }
    return null;
  }

  static async countDocuments(query = {}) {
    const list = await this.find(query);
    return list.length;
  }

  static wrapWorkflow(raw) {
    return {
      ...raw,
      _id: raw._id,
      id: raw._id,
      save: async function () {
        this.updatedAt = new Date();
        inMemoryStore.workflows.set(this._id.toString(), { ...this });
        return this;
      },
      toObject: function () {
        return { ...this };
      },
    };
  }
}

export const Workflow = new Proxy(MongooseWorkflow, {
  get(target, prop) {
    const status = getDBStatus();
    if (status.isInMemoryFallback) {
      if (prop in InMemoryWorkflow) {
        return InMemoryWorkflow[prop].bind(InMemoryWorkflow);
      }
    }
    return target[prop];
  },
});

export default Workflow;
