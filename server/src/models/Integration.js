import mongoose from 'mongoose';
import crypto from 'crypto';
import config from '../config/env.js';
import { inMemoryStore, getDBStatus } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

// AES-256-CBC Encryption / Decryption Helper
const ALGORITHM = 'aes-256-cbc';
const getEncryptionKey = () => {
  const rawKey = config.security.credentialEncryptionKey || '0123456789abcdef0123456789abcdef';
  // Ensure key is exactly 32 bytes
  return crypto.createHash('sha256').update(String(rawKey)).digest();
};

export const encryptCredential = (data) => {
  if (!data) return null;
  const text = typeof data === 'string' ? data : JSON.stringify(data);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getEncryptionKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
};

export const decryptCredential = (encryptedText) => {
  if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.includes(':')) {
    return null;
  }
  try {
    const [ivHex, encrypted] = encryptedText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getEncryptionKey(), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    console.error('[Security] Credential decryption error:', err.message);
    return null;
  }
};

const integrationSchema = new mongoose.Schema(
  {
    owner: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
      required: true,
    },
    isConnected: {
      type: Boolean,
      default: false,
    },
    scopes: {
      type: [String],
      default: [],
    },
    encryptedCredentials: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const MongooseIntegration = mongoose.model('Integration', integrationSchema);

class InMemoryIntegration {
  static async find(query = {}) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseIntegration.find(query);
    }
    const results = [];
    for (const item of inMemoryStore.integrations.values()) {
      let match = true;
      if (query.owner && item.owner.toString() !== query.owner.toString()) match = false;
      if (query.provider && item.provider !== query.provider) match = false;
      if (match) results.push(this.wrapIntegration(item));
    }
    return results;
  }

  static async findOne(query) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseIntegration.findOne(query);
    }
    const list = await this.find(query);
    return list.length > 0 ? list[0] : null;
  }

  static async findById(id) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseIntegration.findById(id);
    }
    const item = inMemoryStore.integrations.get(id.toString());
    return item ? this.wrapIntegration(item) : null;
  }

  static async create(data) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseIntegration.create(data);
    }
    const id = uuidv4();
    const newIntegration = {
      _id: id,
      id: id,
      owner: data.owner ? data.owner.toString() : 'system',
      provider: data.provider,
      isConnected: data.isConnected !== undefined ? data.isConnected : true,
      scopes: data.scopes || [],
      encryptedCredentials: data.encryptedCredentials || null,
      metadata: data.metadata || {},
      expiresAt: data.expiresAt || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    inMemoryStore.integrations.set(id, newIntegration);
    return this.wrapIntegration(newIntegration);
  }

  static async findOneAndUpdate(query, update, options = {}) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseIntegration.findOneAndUpdate(query, update, options);
    }
    let existing = await this.findOne(query);
    if (!existing && options.upsert) {
      const dataToCreate = { ...query, ...update.$set, ...update };
      delete dataToCreate.$set;
      return this.create(dataToCreate);
    }
    if (existing) {
      const updateData = update.$set ? update.$set : update;
      const updated = { ...existing, ...updateData, updatedAt: new Date() };
      inMemoryStore.integrations.set(existing._id.toString(), updated);
      return this.wrapIntegration(updated);
    }
    return null;
  }

  static wrapIntegration(raw) {
    return {
      ...raw,
      _id: raw._id,
      id: raw._id,
      save: async function () {
        this.updatedAt = new Date();
        inMemoryStore.integrations.set(this._id.toString(), { ...this });
        return this;
      },
      toObject: function () {
        return { ...this };
      },
    };
  }
}

export const Integration = new Proxy(MongooseIntegration, {
  get(target, prop) {
    const status = getDBStatus();
    if (status.isInMemoryFallback) {
      if (prop in InMemoryIntegration) {
        return InMemoryIntegration[prop].bind(InMemoryIntegration);
      }
    }
    return target[prop];
  },
});

export default Integration;
