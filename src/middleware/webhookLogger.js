/**
 * Webhook Logger Middleware
 * Unified logging for all webhook requests including timing, body, and response info
 */

const logger = require('../utils/logger');

const webhookLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';
  
  // Determine if this is a webhook endpoint
  const isWebhook = url.includes('/telegram') || url.includes('/cometchat');
  const webhookService = url.includes('/telegram') ? 'telegram' : 
                        url.includes('/cometchat') ? 'cometchat' : 'unknown';

  // Log incoming request with enhanced details for webhooks
  if (isWebhook) {
    logger.info('🔔 Webhook request received', {
      service: webhookService,
      method,
      url,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  } else {
    logger.info('📥 Request received', {
      method,
      url,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  }

  // Log request body for webhook POST/PUT/PATCH requests
  if (isWebhook && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    if (req.body && Object.keys(req.body).length > 0) {
      const bodyString = JSON.stringify(req.body);
      const prettyPayload = JSON.stringify(req.body, null, 2);
      
      // Single comprehensive log entry with beautified JSON
      logger.webhook(webhookService, 'payload_received', {
        method,
        url,
        bodySize: bodyString.length,
        hasData: Object.keys(req.body).length > 0,
        prettyJSON: `\n${prettyPayload}`  // Beautified JSON in single log
      });
    }
  }

  // Override res.end to log response details
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    if (isWebhook) {
      logger.info('🔔 Webhook response sent', {
        service: webhookService,
        method,
        url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        success: res.statusCode < 400
      });
    } else {
      logger.info('📤 Response sent', {
        method,
        url,
        statusCode: res.statusCode,
        duration: `${duration}ms`
      });
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = webhookLogger;