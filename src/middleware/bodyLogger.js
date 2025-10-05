/**
 * Body Logger Middleware
 * Logs request bodies for webhook debugging
 */

const logger = require('../utils/logger');

const bodyLogger = (req, res, next) => {
  // Only log bodies for POST/PUT/PATCH requests
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    // Log the actual body content if it exists
    if (req.body && Object.keys(req.body).length > 0) {
      logger.info('📄 Request Body', {
        method: req.method,
        url: req.url,
        bodyJSON: JSON.stringify(req.body, null, 2)
      });
    }
  }

  next();
};

module.exports = bodyLogger;