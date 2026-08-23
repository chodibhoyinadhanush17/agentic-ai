import mongoose from 'mongoose';
import { inMemoryStore, getDBStatus } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const notificationSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
      index: true,
    },
    workflowId: {
      type: String,
      default: null,
    },
    executionId: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info',
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseNotification = mongoose.model('Notification', notificationSchema);

class InMemoryNotification {
  static async find(query = {}) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseNotification.find(query).sort({ createdAt: -1 });
    }
    const results = [];
    for (const item of inMemoryStore.notifications.values()) {
      let match = true;
      if (query.owner && item.owner.toString() !== query.owner.toString()) match = false;
      if (query.isRead !== undefined && item.isRead !== query.isRead) match = false;
      if (match) results.push(this.wrapNotification(item));
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async create(data) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseNotification.create(data);
    }
    const id = uuidv4();
    const newNotification = {
      _id: id,
      id: id,
      owner: data.owner ? data.owner.toString() : 'system',
      workflowId: data.workflowId || null,
      executionId: data.executionId || null,
      type: data.type || 'info',
      title: data.title,
      message: data.message,
      isRead: data.isRead || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryStore.notifications.set(id, newNotification);
    return this.wrapNotification(newNotification);
  }

  static async updateMany(query, update) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseNotification.updateMany(query, update);
    }
    for (const item of inMemoryStore.notifications.values()) {
      let match = true;
      if (query.owner && item.owner.toString() !== query.owner.toString()) match = false;
      if (match) {
        if (update.$set) {
          Object.assign(item, update.$set);
        } else {
          Object.assign(item, update);
        }
        item.updatedAt = new Date();
      }
    }
    return { modifiedCount: 1 };
  }

  static wrapNotification(raw) {
    return {
      ...raw,
      _id: raw._id,
      id: raw._id,
      save: async function () {
        this.updatedAt = new Date();
        inMemoryStore.notifications.set(this._id.toString(), { ...this });
        return this;
      },
      toObject: function () {
        return { ...this };
      },
    };
  }
}

export const Notification = new Proxy(MongooseNotification, {
  get(target, prop) {
    const status = getDBStatus();
    if (status.isInMemoryFallback) {
      if (prop in InMemoryNotification) {
        return InMemoryNotification[prop].bind(InMemoryNotification);
      }
    }
    return target[prop];
  },
});

export default Notification;
