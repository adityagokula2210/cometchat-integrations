/**
 * Logger Utility
 * Provides structured logging throughout the application
 */

const config = require('../config');

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
      message,
      ...meta
    };

    return JSON.stringify(logEntry, null, 2);
  }

  log(level, message, meta = {}) {
    if (!config.logging.enableConsole) return;

    const formattedMessage = this.formatMessage(level, message, meta);
    
    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'debug':
        if (config.server.env === 'development') {
          console.debug(formattedMessage);
        }
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