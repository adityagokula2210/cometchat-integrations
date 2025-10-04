/**
 * Request Validation Utility
 * Provides validation helpers for incoming requests
 */

const logger = require('./logger');

class Validator {
  /**
   * Validate CometChat webhook payload
   */
  static validateCometChatWebhook(body) {
    const errors = [];

    if (!body.trigger) {
      errors.push('Missing required field: trigger');
    }

    if (!body.appId) {
      errors.push('Missing required field: appId');
    }

    if (!body.data) {
      errors.push('Missing required field: data');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate Telegram webhook payload
   */
  static validateTelegramWebhook(body) {
    const errors = [];

    if (!body.update_id) {
      errors.push('Missing required field: update_id');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate webhook signature (if applicable)
   */
  static validateWebhookSignature(headers, body, secret) {
    // Implement signature validation logic here
    // This is a placeholder for security validation
    return true;
  }

  /**
   * Sanitize input data
   */
  static sanitize(data) {
    if (typeof data === 'string') {
      return data.trim();
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitize(value);
      }
      return sanitized;
    }

    return data;
  }
}

module.exports = Validator;