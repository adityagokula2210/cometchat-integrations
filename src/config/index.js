/**
 * Application Configuration
 * Centralizes all environment variables and app settings
 */

const config = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    trustProxy: true
  },

  // CometChat Configuration
  cometchat: {
    appId: process.env.COMETCHAT_APP_ID || '16696159d8875f66f',
    region: process.env.COMETCHAT_REGION || 'in',
    apiKey: process.env.COMETCHAT_API_KEY || '',
    webhookSecret: process.env.COMETCHAT_WEBHOOK_SECRET || ''
  },

  // Telegram Configuration
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || ''
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: process.env.ENABLE_FILE_LOGGING === 'true'
  },

  // Security Configuration
  security: {
    enableAuth: process.env.ENABLE_AUTH === 'true',
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*']
  }
};

module.exports = config;