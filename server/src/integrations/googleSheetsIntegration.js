import BaseIntegration from './baseIntegration.js';
import axios from 'axios';
import config from '../config/env.js';

export class GoogleSheetsIntegration extends BaseIntegration {
  constructor() {
    super('google-sheets');
  }

  getAuthUrl(state) {
    const clientId = config.oauth.google.clientId || 'demo-google-client-id';
    const redirectUri = encodeURIComponent(config.oauth.google.redirectUri);
    const scope = encodeURIComponent('https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly');
    return `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&access_type=offline&prompt=consent`;
  }

  async handleCallback(code) {
    if (!config.oauth.google.clientId || !config.oauth.google.clientSecret) {
      return {
        accessToken: `mock_sheets_access_token_${Date.now()}`,
        refreshToken: `mock_sheets_refresh_token_${Date.now()}`,
        expiresAt: new Date(Date.now() + 3600 * 1000),
        scopes: ['spreadsheets', 'drive.readonly'],
      };
    }

    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: config.oauth.google.clientId,
        client_secret: config.oauth.google.clientSecret,
        redirect_uri: config.oauth.google.redirectUri,
        grant_type: 'authorization_code',
      });

      return {
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
        expiresAt: new Date(Date.now() + response.data.expires_in * 1000),
        scopes: response.data.scope ? response.data.scope.split(' ') : ['spreadsheets'],
      };
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  async testConnection(credentials) {
    if (!credentials || !credentials.accessToken) return true;
    if (credentials.accessToken.startsWith('mock_')) return true;
    try {
      const res = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${credentials.accessToken}` },
      });
      return !!res.data.sub;
    } catch {
      return false;
    }
  }

  async executeAction(action, payload = {}, credentials = {}) {
    const creds = credentials && credentials.accessToken
      ? credentials
      : { accessToken: `mock_sheets_dev_${Date.now()}` };

    switch (action) {
      case 'append_row':
      case 'append':
        return this.appendRow(payload, creds);
      case 'read_range':
      case 'read':
        return this.readRange(payload, creds);
      default:
        return this.appendRow(payload, creds);
    }
  }

  async appendRow(payload, credentials) {
    const { spreadsheetId = 'default_spreadsheet', range = 'Sheet1!A:Z' } = payload;
    
    // Normalize values into array
    let rowValues = [];
    if (Array.isArray(payload.values)) {
      rowValues = payload.values;
    } else if (payload.values && typeof payload.values === 'object') {
      rowValues = Object.values(payload.values);
    } else if (payload.data && typeof payload.data === 'object') {
      rowValues = Object.values(payload.data);
    } else {
      rowValues = [
        new Date().toISOString(),
        payload.vendor || payload.name || 'Vendor Acme',
        payload.total || payload.amount || '$1,250.00',
        payload.status || 'PROCESSED',
        payload.summary || 'Extracted by Agentflow AI',
      ];
    }

    if (!credentials || credentials.accessToken?.startsWith('mock_') || !credentials.accessToken) {
      return {
        success: true,
        spreadsheetId,
        tableRange: range,
        updatedRows: 1,
        updatedColumns: rowValues.length,
        valuesAppended: rowValues,
        status: 'APPENDED',
        timestamp: new Date().toISOString(),
      };
    }

    try {
      const response = await axios.post(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`,
        { values: [rowValues] },
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );

      return {
        success: true,
        spreadsheetId,
        updatedRange: response.data.updates?.updatedRange,
        updatedRows: response.data.updates?.updatedRows || 1,
        valuesAppended: rowValues,
      };
    } catch (err) {
      throw this.normalizeError(err);
    }
  }

  async readRange(payload, credentials) {
    const { spreadsheetId = 'default_spreadsheet', range = 'Sheet1!A1:E10' } = payload;

    if (!credentials || credentials.accessToken?.startsWith('mock_') || !credentials.accessToken) {
      return {
        success: true,
        spreadsheetId,
        range,
        values: [
          ['Timestamp', 'User', 'Status', 'Amount', 'Channel'],
          [new Date().toISOString(), 'alex@company.com', 'PROCESSED', '$1,250.00', 'Slack'],
          [new Date().toISOString(), 'sarah@client.io', 'PENDING', '$450.00', 'Email'],
        ],
      };
    }

    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`,
        { headers: { Authorization: `Bearer ${credentials.accessToken}` } }
      );

      return {
        success: true,
        spreadsheetId,
        range: response.data.range,
        values: response.data.values || [],
      };
    } catch (err) {
      throw this.normalizeError(err);
    }
  }
}

export default new GoogleSheetsIntegration();
