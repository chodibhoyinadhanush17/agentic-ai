import { Integration, encryptCredential, decryptCredential } from '../models/Integration.js';
import gmailIntegration from '../integrations/gmailIntegration.js';
import slackIntegration from '../integrations/slackIntegration.js';
import discordIntegration from '../integrations/discordIntegration.js';
import googleSheetsIntegration from '../integrations/googleSheetsIntegration.js';

const integrationRegistry = {
  gmail: gmailIntegration,
  slack: slackIntegration,
  discord: discordIntegration,
  'google-sheets': googleSheetsIntegration,
};

export class IntegrationService {
  getProviderHandler(provider) {
    const handler = integrationRegistry[provider];
    if (!handler) {
      throw new Error(`Unknown integration provider: ${provider}`);
    }
    return handler;
  }

  async listUserIntegrations(userId) {
    const integrations = await Integration.find({ owner: userId });
    
    // Ensure all 4 core integrations are represented even if not connected yet
    const providers = ['gmail', 'slack', 'discord', 'google-sheets'];
    const result = providers.map((provider) => {
      const existing = integrations.find((i) => i.provider === provider);
      if (existing) {
        return {
          id: existing._id,
          provider: existing.provider,
          isConnected: existing.isConnected,
          scopes: existing.scopes,
          metadata: existing.metadata,
          expiresAt: existing.expiresAt,
          updatedAt: existing.updatedAt,
        };
      }
      return {
        id: null,
        provider,
        isConnected: false,
        scopes: [],
        metadata: {},
        expiresAt: null,
        updatedAt: null,
      };
    });

    return result;
  }

  async getIntegrationStatus(userId) {
    const list = await this.listUserIntegrations(userId);
    const statuses = {};
    for (const item of list) {
      statuses[item.provider] = {
        connected: item.isConnected,
        expiresAt: item.expiresAt,
        scopes: item.scopes,
      };
    }
    return statuses;
  }

  async getAuthUrl(provider, state) {
    const handler = this.getProviderHandler(provider);
    return handler.getAuthUrl(state);
  }

  async handleOAuthCallback(provider, code, userId) {
    const handler = this.getProviderHandler(provider);
    const tokenData = await handler.handleCallback(code);

    const encryptedCredentials = encryptCredential(tokenData);

    const updated = await Integration.findOneAndUpdate(
      { owner: userId, provider },
      {
        $set: {
          isConnected: true,
          scopes: tokenData.scopes || [],
          encryptedCredentials,
          metadata: {
            accountEmail: tokenData.accountEmail,
            teamName: tokenData.teamName,
            guildName: tokenData.guildName,
            connectedAt: new Date().toISOString(),
          },
          expiresAt: tokenData.expiresAt || null,
        },
      },
      { upsert: true, new: true }
    );

    return {
      provider,
      isConnected: true,
      metadata: updated.metadata,
    };
  }

  async saveManualCredentials(userId, { provider, credentials, metadata = {} }) {
    if (!provider || !credentials) {
      throw new Error('Provider and credentials are required');
    }

    const encryptedCredentials = encryptCredential(credentials);

    const updated = await Integration.findOneAndUpdate(
      { owner: userId, provider },
      {
        $set: {
          isConnected: true,
          encryptedCredentials,
          metadata: {
            ...metadata,
            configuredManually: true,
            updatedAt: new Date().toISOString(),
          },
        },
      },
      { upsert: true, new: true }
    );

    return {
      id: updated._id,
      provider: updated.provider,
      isConnected: updated.isConnected,
      metadata: updated.metadata,
    };
  }

  async disconnectIntegration(userId, provider) {
    const updated = await Integration.findOneAndUpdate(
      { owner: userId, provider },
      {
        $set: {
          isConnected: false,
          encryptedCredentials: null,
          expiresAt: null,
        },
      },
      { new: true }
    );
    return { provider, isConnected: false };
  }

  async executeIntegrationAction(userId, provider, action, payload) {
    const integration = await Integration.findOne({ owner: userId, provider });
    
    // Retrieve decrypted credentials if available
    let credentials = null;
    if (integration && integration.encryptedCredentials) {
      credentials = decryptCredential(integration.encryptedCredentials);
    }

    const handler = this.getProviderHandler(provider);
    return handler.executeAction(action, payload, credentials);
  }
}

export default new IntegrationService();
