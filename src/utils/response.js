/**
 * Response Utility
 * Standardizes API responses across the application
 */

const logger = require('./logger');

class ResponseHandler {
  /**
   * Send successful response
   */
  static success(res, message, data = {}, statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString(),
      data
    };

    logger.debug('Sending success response', { statusCode, response });
    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(res, message, error = null, statusCode = 500) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      error: error ? {
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      } : undefined
    };

    logger.error('Sending error response', { statusCode, response });
    return res.status(statusCode).json(response);
  }

  /**
   * Send webhook response
   */
  static webhook(res, service, received = {}) {
    const response = {
      success: true,
      message: `${service} data received successfully`,
      timestamp: new Date().toISOString(),
      received: {
        bodySize: JSON.stringify(received).length,
        hasData: Object.keys(received).length > 0,
        service: service.toLowerCase(),
        ...received
      }
    };

    // No additional logging here - middleware handles webhook logging
    return res.status(200).json(response);
  }

  /**
   * Send health check response
   */
  static health(res, additionalData = {}) {
    const response = {
      status: 'OK',
      message: 'CometChat Integrations server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      deployment: 'auto-deploy-working-v2.0',
      ...additionalData
    };

    return res.status(200).json(response);
  }
}

module.exports = ResponseHandler;