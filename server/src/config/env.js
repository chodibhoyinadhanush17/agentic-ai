import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from multiple standard locations
dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // server/.env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') }); // root .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  
  jwt: {
    secret: process.env.JWT_SECRET || 'agentflow_default_jwt_secret_key_change_in_production_32char',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  security: {
    credentialEncryptionKey: process.env.CREDENTIAL_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
  },
  
  db: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/agentflow_ai',
  },
  
  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  },
  
  ai: {
    openRouterApiKey: process.env.OPENROUTER_API_KEY || '',
    openRouterModel: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
    geminiModel: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  },
  
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/google/callback',
    },
    slack: {
      clientId: process.env.SLACK_CLIENT_ID || '',
      clientSecret: process.env.SLACK_CLIENT_SECRET || '',
      botToken: process.env.SLACK_BOT_TOKEN || '',
      redirectUri: process.env.SLACK_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/slack/callback',
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID || '',
      clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
      botToken: process.env.DISCORD_BOT_TOKEN || '',
      redirectUri: process.env.DISCORD_REDIRECT_URI || 'http://localhost:5000/api/integrations/oauth/discord/callback',
    },
  },
};

export default config;
