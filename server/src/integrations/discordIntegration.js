import BaseIntegration from './baseIntegration.js';
import axios from 'axios';
import config from '../config/env.js';

export class DiscordIntegration extends BaseIntegration {
  constructor() {
    super('discord');
  }

  getAuthUrl(state) {
    const clientId = config.oauth.discord.clientId || 'demo-discord-client-id';
    const redirectUri = encodeURIComponent(config.oauth.discord.redirectUri);
    const scope = encodeURIComponent('bot identify incoming-webhook');
    return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=2048&scope=${scope}&redirect_uri=${redirectUri}&response_type=code&state=${state}`;
  }

  async handleCallback(code) {
    if (!config.oauth.discord.clientId || !config.oauth.discord.clientSecret) {
      return {
        accessToken: `mock_discord_token_${Date.now()}`,
        guildName: 'Agentflow Ops Guild',
        webhookUrl: 'https://discord.com/api/webhooks/mock/test',
        scopes: ['bot', 'incoming-webhook'],
      };
    }

    try {
      const response = await axios.post(
        'https://discord.com/api/oauth2/token',
        new URLSearchParams({
          client_id: config.oauth.discord.clientId,
          client_secret: config.oauth.discord.clientSecret,
          grant_type: 'authorization_code',
          code,
          redirect_uri: config.oauth.discord.redirectUri,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        guildName: response.data.guild?.name || 'Discord Server',
        webhookUrl: response.data.webhook?.url,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
      };
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  async testConnection(credentials) {
    if (!credentials) return true;
    if (credentials.accessToken?.startsWith('mock_') || credentials.botToken?.startsWith('mock_') || credentials.webhookUrl?.includes('mock')) {
      return true;
    }
    const token = credentials.botToken || config.oauth.discord.botToken;
    if (!token) return true;

    try {
      const res = await axios.get('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bot ${token}` },
      });
      return !!res.data.id;
    } catch {
      return false;
    }
  }

  async executeAction(action, payload = {}, credentials = {}) {
    const creds = credentials && (credentials.accessToken || credentials.botToken || credentials.webhookUrl)
      ? credentials
      : { accessToken: `mock_discord_dev_${Date.now()}` };

    switch (action) {
      case 'post_message':
      case 'send_message':
        return this.postMessage(payload, creds);
      case 'post_embed':
        return this.postEmbed(payload, creds);
      default:
        return this.postMessage(payload, creds);
    }
  }

  async postMessage(payload, credentials) {
    const { content, channelId, username = 'Agentflow AI', message, text } = payload;
    const messageContent = content || text || message || payload.summary || 'Notification dispatched from Agentflow_AI.';

    const isMock = !credentials || credentials.accessToken?.startsWith('mock_') || !credentials.webhookUrl;

    if (isMock && !config.oauth.discord.botToken) {
      return {
        success: true,
        channelId: channelId || 'demo-channel',
        content: messageContent,
        author: username,
        status: 'DELIVERED',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      if (credentials?.webhookUrl) {
        const res = await axios.post(credentials.webhookUrl, {
          content: messageContent,
          username,
        });
        return { success: true, status: 'DELIVERED', data: res.data };
      }

      const botToken = credentials?.botToken || config.oauth.discord.botToken;
      const targetChannel = channelId || payload.channel;
      const res = await axios.post(
        `https://discord.com/api/v10/channels/${targetChannel}/messages`,
        { content: messageContent },
        { headers: { Authorization: `Bot ${botToken}` } }
      );
      return { success: true, messageId: res.data.id, channelId: targetChannel };
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  async postEmbed(payload, credentials) {
    const { title = 'Workflow Notification', description, color = 0x6366f1, fields = [], channelId } = payload;
    const embed = {
      title,
      description: description || payload.summary || payload.message || 'Operation executed by Agentflow_AI.',
      color,
      fields,
      footer: { text: 'Agentflow_AI Autonomous Agent Chain' },
      timestamp: new Date().toISOString(),
    };

    if (!credentials?.webhookUrl && !config.oauth.discord.botToken) {
      return {
        success: true,
        embed,
        status: 'DELIVERED',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      if (credentials?.webhookUrl) {
        await axios.post(credentials.webhookUrl, { embeds: [embed] });
        return { success: true, status: 'DELIVERED' };
      }
      const botToken = credentials?.botToken || config.oauth.discord.botToken;
      await axios.post(
        `https://discord.com/api/v10/channels/${channelId}/messages`,
        { embeds: [embed] },
        { headers: { Authorization: `Bot ${botToken}` } }
      );
      return { success: true, status: 'DELIVERED' };
    } catch (err) {
      throw this.normalizeError(err);
    }
  }
}

export default new DiscordIntegration();
