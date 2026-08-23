import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import config from '../config/env.js';

export class AuthService {
  async seedDemoUser() {
    try {
      const email = 'operator@agentflow.ai';
      const existing = await User.findOne({ email });
      if (!existing) {
        await User.create({
          name: 'Lead Operator',
          email,
          password: 'password123',
          role: 'admin',
        });
        console.log(`[AuthService] Demo operator account ready: ${email} / password123`);
      }
    } catch (err) {
      console.warn('[AuthService] Demo user seed notice:', err.message);
    }
  }

  async register({ name, email, password, role = 'operator' }) {
    if (!name || !email || !password) {
      const error = new Error('Name, email, and password are required');
      error.statusCode = 400;
      throw error;
    }

    const cleanEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const error = new Error('An account with this email address already exists. Please sign in instead.');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: role || 'operator',
    });

    const token = this.generateToken(user);

    return {
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async login({ email, password }) {
    if (!email || !password) {
      const error = new Error('Please provide email and password');
      error.statusCode = 400;
      throw error;
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      throw error;
    }

    user.lastLogin = new Date();
    await user.save();

    const token = this.generateToken(user);

    return {
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
      },
      token,
    };
  }

  async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: user._id || user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }

  generateToken(user) {
    const id = user._id || user.id;
    return jwt.sign(
      {
        id,
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  verifyToken(token) {
    try {
      return jwt.verify(token, config.jwt.secret);
    } catch {
      const error = new Error('Invalid or expired authentication token');
      error.statusCode = 401;
      throw error;
    }
  }
}

export default new AuthService();
