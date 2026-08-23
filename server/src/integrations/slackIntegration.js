import BaseIntegration from './baseIntegration.js';
import axios from 'axios';
import config from '../config/env.js';

export class SlackIntegration extends BaseIntegration {
  constructor() {
    super('slack');
  }

  getAuthUrl(state) {
    const clientId = config.oauth.slack.clientId || 'demo-slack-client-id';
    const redirectUri = encodeURIComponent(config.oauth.slack.redirectUri);
    const scope = encodeURIComponent('chat:write,chat:write.public,channels:read,incoming-webhook');
    return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`;
  }

  async handleCallback(code) {
    if (!config.oauth.slack.clientId || !config.oauth.slack.clientSecret) {
      return {
        accessToken: `mock_slack_bot_token_${Date.now()}`,
        teamName: 'Agentflow Workspace',
        botUserId: 'U0AGENTFLOW',
        scopes: ['chat:write', 'channels:read'],
      };
    }

    try {
      const response = await axios.post(
        'https://slack.com/api/oauth.v2.access',
        new URLSearchParams({
          code,
          client_id: config.oauth.slack.clientId,
          client_secret: config.oauth.slack.clientSecret,
          redirect_uri: config.oauth.slack.redirectUri,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Slack OAuth failed');
      }

      return {
        accessToken: response.data.access_token,
        teamName: response.data.team?.name,
        botUserId: response.data.bot_user_id,
        incomingWebhook: response.data.incoming_webhook?.url,
        scopes: response.data.scope ? response.data.scope.split(',') : [],
      };
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  async testConnection(credentials) {
    if (!credentials || !credentials.accessToken) return true;
    if (credentials.accessToken.startsWith('mock_')) return true;

    try {
      const res = await axios.post(
        'https://slack.com/api/auth.test',
        {},
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );
      return res.data.ok === true;
    } catch {
      return false;
    }
  }

  async executeAction(action, payload = {}, credentials = {}) {
    const creds = credentials && credentials.accessToken
      ? credentials
      : { accessToken: `mock_slack_dev_${Date.now()}` };

    switch (action) {
      case 'post_message':
      case 'send_message':
        return this.postMessage(payload, creds);
      case 'post_channel_alert':
        return this.postChannelAlert(payload, creds);
      default:
        return this.postMessage(payload, creds);
    }
  }

  async postMessage(payload, credentials) {
    const { channel = '#general', text, blocks, message } = payload;
    const messageContent = text || message || payload.summary || 'Notification dispatched from Agentflow_AI.';

    if (!credentials || credentials.accessToken?.startsWith('mock_') || !credentials.accessToken) {
      return {
        success: true,
        channel,
        messageId: `slack_ts_${Date.now()}`,
        text: messageContent,
        status: 'DELIVERED',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel,
          text: messageContent,
          blocks,
        },
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Slack chat.postMessage failed');
      }

      return {
        success: true,
        channel: response.data.channel,
        ts: response.data.ts,
        message: response.data.message,
      };
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  async postChannelAlert(payload, credentials) {
    const { channel = '#alerts', title = 'Workflow Alert', severity = 'info', message } = payload;

    const blocks = [
      {
        type: 'header',
        text: { type: 'plain_text', text: `🚨 ${title}` },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: message || payload.text || 'Notification from Agentflow_AI.' },
      },
      {
        type: 'context',
        elements: [{ type: 'mrkdwn', text: `*Agentflow_AI* | Severity: *${severity.toUpperCase()}*` }],
      },
    ];

    return this.postMessage({ channel, text: `[${severity.toUpperCase()}] ${title}: ${message || payload.text}`, blocks }, credentials);
  }
}

export default new SlackIntegration();
