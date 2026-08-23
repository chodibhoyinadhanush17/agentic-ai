/**
 * Base Integration Class
 * All third-party providers inherit from this interface to guarantee uniform lifecycle and execution semantics.
 */
export class BaseIntegration {
  constructor(providerName) {
    this.providerName = providerName;
  }

  /**
   * Generates the OAuth authorization redirect URL
   * @param {string} state - Secure state parameter
   * @returns {string} Auth URL
   */
  getAuthUrl(state) {
    throw new Error(`getAuthUrl not implemented for ${this.providerName}`);
  }

  /**
   * Exchanges an OAuth code for access & refresh tokens
   * @param {string} code - OAuth authorization code
   * @returns {Promise<Object>} Token payload { accessToken, refreshToken, expiresAt, scopes }
   */
  async handleCallback(code) {
    throw new Error(`handleCallback not implemented for ${this.providerName}`);
  }

  /**
   * Tests whether the stored credentials are still valid
   * @param {Object} credentials - Decrypted credentials object
   * @returns {Promise<boolean>}
   */
  async testConnection(credentials) {
    throw new Error(`testConnection not implemented for ${this.providerName}`);
  }

  /**
   * Executes a specific action on the integration provider
   * @param {string} action - Action name (e.g., 'send_email', 'post_message')
   * @param {Object} payload - Input payload
   * @param {Object} credentials - Decrypted credentials
   * @returns {Promise<Object>} Output result
   */
  async executeAction(action, payload, credentials) {
    throw new Error(`executeAction not implemented for ${this.providerName}`);
  }

  /**
   * Normalizes standard errors into structured domain errors
   * @param {Error} error
   * @returns {Error}
   */
  normalizeError(error) {
    const message = error?.response?.data?.error || error?.message || 'Integration execution failed';
    const status = error?.response?.status;
    
    if (status === 401 || message.includes('auth') || message.includes('unauthorized') || message.includes('expired')) {
      const err = new Error(`AUTH_EXPIRED: ${message}`);
      err.code = 'AUTH_EXPIRED';
      return err;
    }
    if (status === 429 || message.includes('rate limit')) {
      const err = new Error(`RATE_LIMIT: ${message}`);
      err.code = 'RATE_LIMIT';
      return err;
    }
    const err = new Error(`API_FAILURE: ${message}`);
    err.code = 'API_FAILURE';
    return err;
  }
}

export default BaseIntegration;
