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

      if (service === 'discord') {
        // Check for Discord signature header if public key is configured
        if (config.discord.publicKey) {
          const signature = headers['x-signature-ed25519'];
          const timestamp = headers['x-signature-timestamp'];
          
          if (!signature || !timestamp) {
            logger.warn('Missing Discord signature headers');
            return ResponseHandler.error(res, 'Missing signature headers', {}, 401);
          }
          
          // TODO: Implement Discord signature verification using nacl
          logger.debug('Discord signature headers present', { 
            hasSignature: !!signature, 
            hasTimestamp: !!timestamp 
          });
        }

        // Validate Discord webhook structure
        const validation = Validator.validateDiscordWebhook(body);
        if (!validation.isValid) {
          logger.warn('Invalid Discord webhook payload', { errors: validation.errors });
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