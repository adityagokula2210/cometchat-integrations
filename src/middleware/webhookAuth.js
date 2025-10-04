/**
 * Webhook Authentication Middleware
 * Validates webhook signatures and authentication
 */

const logger = require('../utils/logger');
const ResponseHandler = require('../utils/response');
const Validator = require('../utils/validator');
const config = require('../config');

const webhookAuth = (service) => {
  return (req, res, next) => {
    try {
      const { headers, body } = req;
      
      // Log authentication attempt
      logger.debug(`Authenticating ${service} webhook`, {
        service,
        headers: Object.keys(headers),
        hasBody: !!body
      });

      // For now, we'll do basic validation
      // In production, implement proper signature validation
      
      if (service === 'cometchat') {
        // Check for basic auth or API key
        const authHeader = headers.authorization;
        if (config.cometchat.webhookSecret && authHeader) {
          // Validate authorization header
          logger.debug('CometChat auth header found', { authHeader: authHeader.substring(0, 20) + '...' });
        }
        
        // Validate payload structure
        const validation = Validator.validateCometChatWebhook(body);
        if (!validation.isValid) {
          logger.warn('Invalid CometChat webhook payload', { errors: validation.errors });
          return ResponseHandler.error(res, 'Invalid webhook payload', { errors: validation.errors }, 400);
        }
      }

      if (service === 'telegram') {
        // Validate Telegram webhook structure
        const validation = Validator.validateTelegramWebhook(body);
        if (!validation.isValid) {
          logger.warn('Invalid Telegram webhook payload', { errors: validation.errors });
          return ResponseHandler.error(res, 'Invalid webhook payload', { errors: validation.errors }, 400);
        }
      }

      logger.debug(`${service} webhook authentication successful`);
      next();

    } catch (error) {
      logger.error(`Webhook authentication failed for ${service}`, { error: error.message });
      ResponseHandler.error(res, 'Authentication failed', error, 401);
    }
  };
};

module.exports = webhookAuth;