import authService from '../services/authService.js';
import { validationResult } from 'express-validator';

export class AuthController {
  async register(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0]?.msg || 'Validation failed';
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: firstError },
          errors: errors.array(),
        });
      }

      const { name, email, password, role } = req.body;
      const result = await authService.register({ name, email, password, role });
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 400).json({
        success: false,
        error: { code: 'REGISTRATION_FAILED', message: err.message },
      });
    }
  }

  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0]?.msg || 'Validation failed';
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: firstError },
          errors: errors.array(),
        });
      }

      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(err.statusCode || 401).json({
        success: false,
        error: { code: 'AUTH_FAILED', message: err.message },
      });
    }
  }

  async getMe(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await authService.getMe(userId);
      return res.json({ success: true, data: user });
    } catch (err) {
      return res.status(err.statusCode || 404).json({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: err.message },
      });
    }
  }
}

export default new AuthController();
