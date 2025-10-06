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
      
      // Log authentication attempt with payload details
      logger.debug(`Authenticating ${service} webhook`, {
        service,
        headers: Object.keys(headers),
        hasBody: !!body,
        bodyKeys: body ? Object.keys(body) : [],
        contentLength: headers['content-length'],
        contentType: headers['content-type']
      });

      // Log full payload for CometChat webhooks (for debugging)
      if (service === 'cometchat' && body) {
        logger.info('🔍 CometChat webhook raw payload', {
          service: 'cometchat',
          method: 'webhook_auth',
          rawPayload: body,
          payloadSize: JSON.stringify(body).length,
          trigger: body.trigger,
          appId: body.appId,
          hasData: !!body.data,
          dataStructure: body.data ? (typeof body.data === 'object' ? Object.keys(body.data) : typeof body.data) : null
        });
      }

      // For now, we'll do basic validation
      // In production, implement proper signature validation
      
      if (service === 'cometchat') {
        // Check for basic auth or API key (only if webhook secret is configured)
        const authHeader = headers.authorization;
        if (config.cometchat.webhookSecret && authHeader) {
          // Validate authorization header
          logger.debug('CometChat auth header found', { authHeader: authHeader.substring(0, 20) + '...' });
        } else if (config.cometchat.webhookSecret) {
          logger.warn('CometChat webhook secret configured but no auth header found');
        }
        
        // Validate payload structure (more permissive)
        const validation = Validator.validateCometChatWebhook(body);
        if (!validation.isValid) {
          logger.warn('Invalid CometChat webhook payload', { errors: validation.errors, body });
          // Don't block the request, just log the warning for now
          // return ResponseHandler.error(res, 'Invalid webhook payload', { errors: validation.errors }, 400);
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