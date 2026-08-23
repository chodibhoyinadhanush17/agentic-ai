import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { inMemoryStore, getDBStatus } from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['admin', 'operator'],
      default: 'operator',
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Password hashing pre-save hook with bcrypt cost factor 12
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password verification method
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const MongooseUser = mongoose.model('User', userSchema);

// In-Memory Model Implementation for Zero-Config Fallback
class InMemoryUser {
  static async findOne(query) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseUser.findOne(query);
    }
    for (const user of inMemoryStore.users.values()) {
      let match = true;
      if (query._id && user._id !== query._id.toString()) match = false;
      if (query.email && user.email.toLowerCase() !== query.email.toLowerCase()) match = false;
      if (match) {
        return this.wrapUser(user);
      }
    }
    return null;
  }

  static async findById(id) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseUser.findById(id);
    }
    const user = inMemoryStore.users.get(id.toString());
    return user ? this.wrapUser(user) : null;
  }

  static async create(userData) {
    const status = getDBStatus();
    if (!status.isInMemoryFallback) {
      return MongooseUser.create(userData);
    }
    
    // Check for duplicate email
    for (const existing of inMemoryStore.users.values()) {
      if (existing.email.toLowerCase() === userData.email.toLowerCase()) {
        const error = new Error('User with this email already exists');
        error.code = 11000;
        throw error;
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const id = uuidv4();
    const newUser = {
      _id: id,
      id: id,
      name: userData.name,
      email: userData.email.toLowerCase().trim(),
      password: hashedPassword,
      role: userData.role || 'operator',
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryStore.users.set(id, newUser);
    return this.wrapUser(newUser);
  }

  static wrapUser(raw) {
    const userObj = { ...raw };
    return {
      ...userObj,
      _id: raw._id,
      id: raw._id,
      comparePassword: async (candidate) => {
        if (!candidate || !raw.password) return false;
        return bcrypt.compare(candidate, raw.password);
      },
      save: async function () {
        this.updatedAt = new Date();
        inMemoryStore.users.set(this._id.toString(), { ...this });
        return this;
      },
      toObject: function () {
        const copy = { ...this };
        delete copy.comparePassword;
        delete copy.save;
        delete copy.toObject;
        return copy;
      },
    };
  }
}

export const User = new Proxy(MongooseUser, {
  get(target, prop) {
    const status = getDBStatus();
    if (status.isInMemoryFallback) {
      if (prop in InMemoryUser) {
        return InMemoryUser[prop].bind(InMemoryUser);
      }
    }
    return target[prop];
  },
});

export default User;
