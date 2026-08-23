import integrationService from '../services/integrationService.js';
import config from '../config/env.js';

export class IntegrationController {
  async listIntegrations(req, res, next) {
    try {
      const userId = req.user.id;
      const integrations = await integrationService.listUserIntegrations(userId);
      return res.json({ success: true, data: integrations });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'INTEGRATIONS_FETCH_FAILED', message: err.message },
      });
    }
  }

  async getStatus(req, res, next) {
    try {
      const userId = req.user.id;
      const status = await integrationService.getIntegrationStatus(userId);
      return res.json({ success: true, data: status });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: { code: 'STATUS_FETCH_FAILED', message: err.message },
      });
    }
  }

  async startOAuth(req, res, next) {
    try {
      const { provider } = req.params;
      const userId = req.user?.id || 'demo_user';
      const state = Buffer.from(JSON.stringify({ provider, userId, nonce: Date.now() })).toString('base64');
      const authUrl = await integrationService.getAuthUrl(provider, state);
      return res.json({ success: true, data: { authUrl, state } });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'OAUTH_START_FAILED', message: err.message },
      });
    }
  }

  async handleOAuthCallback(req, res, next) {
    try {
      const { provider } = req.params;
      const { code, state, error } = req.query;

      if (error) {
        return res.redirect(`${config.clientUrl}/integrations?error=${encodeURIComponent(error)}`);
      }

      let userId = req.user?.id;
      if (!userId && state) {
        try {
          const parsedState = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
          userId = parsedState.userId;
        } catch {
          // fallback
        }
      }

      const result = await integrationService.handleOAuthCallback(provider, code || 'mock_code', userId || 'demo_user');
      return res.redirect(`${config.clientUrl}/integrations?success=${provider}`);
    } catch (err) {
      console.error('[IntegrationController] OAuth callback error:', err.message);
      return res.redirect(`${config.clientUrl}/integrations?error=${encodeURIComponent(err.message)}`);
    }
  }

  async saveManual(req, res, next) {
    try {
      const userId = req.user.id;
      const { provider, credentials, metadata } = req.body;
      const result = await integrationService.saveManualCredentials(userId, { provider, credentials, metadata });
      return res.status(201).json({ success: true, data: result });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'MANUAL_INTEGRATION_FAILED', message: err.message },
      });
    }
  }

  async disconnect(req, res, next) {
    try {
      const userId = req.user.id;
      const { provider } = req.params;
      const result = await integrationService.disconnectIntegration(userId, provider);
      return res.json({ success: true, data: result });
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: { code: 'DISCONNECT_FAILED', message: err.message },
      });
    }
  }

  async oauthError(req, res, next) {
    const errorMsg = req.query.msg || 'OAuth Authorization failed';
    return res.status(400).json({
      success: false,
      error: { code: 'OAUTH_ERROR', message: errorMsg },
    });
  }
}

export default new IntegrationController();
