/**
 * Webhook Logger Middleware
 * Unified logging for all webhook requests including timing, body, and response info
 */

const logger = require('../utils/logger');

const webhookLogger = (req, res, next) => {
  const { method, url } = req;
  
  // Only log CometChat webhooks
  if (url.includes('/cometchat') && method === 'POST') {
    logger.info('🎯 CometChat webhook received', {
      method,
      url,
      hasBody: !!(req.body && Object.keys(req.body).length > 0)
    });
  }

  next();
};

module.exports = webhookLogger;