/**
 * Body Logger Middleware
 * Specifically logs request bodies after they've been parsed
 */

const logger = require('../utils/logger');

const bodyLogger = (req, res, next) => {
  // Only log bodies for POST/PUT/PATCH requests
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    
    // Log the raw body information
    logger.info('🔍 Request Body Details', {
      method: req.method,
      url: req.url,
      hasBody: !!req.body,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
      bodySize: req.body ? JSON.stringify(req.body).length : 0,
      contentType: req.get('Content-Type'),
      contentLength: req.get('Content-Length')
    });

    // Log the actual body content if it exists
    if (req.body && Object.keys(req.body).length > 0) {
      logger.info('📄 Full Request Body', {
        method: req.method,
        url: req.url,
        body: req.body
      });
    } else {
      logger.info('⚠️ Empty or Missing Body', {
        method: req.method,
        url: req.url,
        message: 'No body content found'
      });
    }
  }

  next();
};

module.exports = bodyLogger;