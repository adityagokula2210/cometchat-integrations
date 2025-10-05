/**
 * Request Logging Middleware
 * Logs all incoming requests with timing information
 */

const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'Unknown';

  // Log basic request info
  logger.info('📥 Incoming request', {
    method,
    url,
    ip,
    userAgent,
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    logger.info('📤 Request completed', {
      method,
      url,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

module.exports = requestLogger;
