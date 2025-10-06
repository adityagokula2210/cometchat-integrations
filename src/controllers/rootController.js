/**
 * Root Controller
 * Handles root endpoint and general API information
 */

const ResponseHandler = require('../utils/response');
const config = require('../config');
const logger = require('../utils/logger');

class RootController {
  /**
   * GET / - Root endpoint with API information
   */
  static async getApiInfo(req, res) {
    try {
      const apiInfo = {
        message: 'Welcome to CometChat Integrations!',
        service: 'Multi-platform Integration Hub',
        version: '2.0.1',
        environment: config.server.env,
        lastUpdated: new Date().toISOString(),
        endpoints: {
          health: '/health',
          status: '/status',
          root: '/',
          cometchat: {
            info: 'GET /cometchat',
            webhook: 'POST /cometchat'
          },
          telegram: {
            info: 'GET /telegram', 
            webhook: 'POST /telegram'
          }
        },
        documentation: {
          github: 'https://github.com/adityagokula2210/cometchat-integrations',
          deployment: 'Auto-deploy enabled via GitHub Actions'
        }
      };

      logger.info('API info requested', { 
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return ResponseHandler.success(res, 'CometChat Integrations API', apiInfo);

    } catch (error) {
      logger.error('API info request failed', { error: error.message });
      return ResponseHandler.error(res, 'Failed to get API information', error);
    }
  }
}

module.exports = RootController;