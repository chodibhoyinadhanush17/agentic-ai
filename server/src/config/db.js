import mongoose from 'mongoose';
import config from './env.js';

let isConnected = false;
let isInMemoryFallback = false;

// In-Memory mock datastore fallback in case MongoDB instance is not reachable
export const inMemoryStore = {
  users: new Map(),
  workflows: new Map(),
  executions: new Map(),
  executionLogs: [],
  integrations: new Map(),
  notifications: new Map(),
  agentMemories: new Map(),
};

export const connectDB = async () => {
  if (isConnected) return;

  const mongoUri = config.db.uri;

  try {
    mongoose.set('strictQuery', false);
    // Set a quick serverSelectionTimeoutMS so local dev doesn't hang if Mongo isn't running
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500,
    });
    isConnected = true;
    isInMemoryFallback = false;
    console.log(`[Database] MongoDB connected successfully to ${mongoUri}`);
  } catch (error) {
    console.warn(`[Database] Real MongoDB connection failed (${error.message}).`);
    console.log(`[Database] Activating High-Performance In-Memory DB Store for local development.`);
    isConnected = true;
    isInMemoryFallback = true;
  }
};

export const getDBStatus = () => ({
  isConnected,
  isInMemoryFallback,
  type: isInMemoryFallback ? 'in-memory-fallback' : 'mongodb',
  uri: isInMemoryFallback ? 'memory://local' : config.db.uri,
});

export default connectDB;
