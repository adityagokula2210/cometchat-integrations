/**
 * Request Logging Middleware
 * Logs all incoming requests with timing information and body content
 */

const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const contentType = req.get('Content-Type') || 'unknown';

  // Capture request body for logging
  let requestBody = {};
  if (req.body && Object.keys(req.body).length > 0) {
    // Log the actual body content
    requestBody = req.body;
  } else if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    requestBody = 'No body or empty body';
  }

  // Log request start with body
  const requestLogData = {
    method,
    url,
    ip,
    userAgent,
    contentType,
    timestamp: new Date().toISOString()
  };

  // Add body to logs for POST/PUT/PATCH requests
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    requestLogData.body = requestBody;
  }

  logger.info('📥 Incoming request', requestLogData);

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    logger.info('📤 Request completed', {
      method,
      url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = requestLogger;