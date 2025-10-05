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

  // Log basic request info immediately
  logger.info('📥 Incoming request', {
    method,
    url,
    ip,
    userAgent,
    contentType,
    timestamp: new Date().toISOString()
  });

  // Override res.end to log response and capture body
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Log request body for POST/PUT/PATCH after it's been parsed
    if ((method === 'POST' || method === 'PUT' || method === 'PATCH') && req.body) {
      logger.info('� Request body', {
        method,
        url,
        body: req.body,
        bodyType: typeof req.body,
        bodySize: JSON.stringify(req.body || {}).length
      });
    }
    
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