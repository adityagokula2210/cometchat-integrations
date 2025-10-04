/**
 * Logger Utility
 * Provides structured logging throughout the application
 */

const config = require('../config');
const SimpleLogger = require('./simpleLogger');

class Logger {
  constructor() {
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message: String(message), // Ensure message is always a string
      ...meta
    };

    try {
      return JSON.stringify(logEntry, null, 2);
    } catch (error) {
      // Fallback if JSON.stringify fails
      return `${timestamp} [${level.toUpperCase()}] ${String(message)}`;
    }
  }

  log(level, message, meta = {}) {
    if (!config.logging.enableConsole) return;

    // Use simple logger in production to avoid PM2 issues
    if (config.server.env === 'production') {
      SimpleLogger.log(level, message, meta);
      return;
    }

    // Ensure message is a string and meta is an object
    const safeMessage = typeof message === 'string' ? message : String(message);
    const safeMeta = typeof meta === 'object' && meta !== null ? meta : {};

    const formattedMessage = this.formatMessage(level, safeMessage, safeMeta);
    
    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }

  // Specific loggers for different services
  cometchat(action, data = {}) {
    this.info(`CometChat ${action}`, {
      service: 'cometchat',
      action,
      ...data
    });
  }

  telegram(action, data = {}) {
    this.info(`Telegram ${action}`, {
      service: 'telegram',
      action,
      ...data
    });
  }

  webhook(service, event, data = {}) {
    this.info(`Webhook received from ${service}`, {
      service,
      event,
      timestamp: new Date().toISOString(),
      ...data
    });
  }
}

module.exports = new Logger();