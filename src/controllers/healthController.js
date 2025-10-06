/**
 * Health Controller
 * Handles health check and system status endpoints
 */

const ResponseHandler = require('../utils/response');
const config = require('../config');
const logger = require('../utils/logger');
const discordGatewayService = require('../services/discordGatewayService');

class HealthController {
  /**
   * Health check endpoint
   */
  static async getHealth(req, res) {
    try {
      const healthData = {
        environment: config.server.env,
        version: '2.0.1',
        services: {
          cometchat: {
            configured: !!config.cometchat.appId,
            appId: config.cometchat.appId,
            region: config.cometchat.region
          },
          telegram: {
            configured: !!config.telegram.botToken
          },
          discord: {
            configured: !!config.discord.botToken,
            gateway: discordGatewayService.getStatus()
          }
        }
      };

      logger.info('Health check requested', { healthData });
      return ResponseHandler.health(res, healthData);

    } catch (error) {
      logger.error('Health check failed', { error: error.message });
      return ResponseHandler.error(res, 'Health check failed', error);
    }
  }

  /**
   * System status endpoint
   */
  static async getStatus(req, res) {
    try {
      const status = {
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          platform: process.platform,
          nodeVersion: process.version
        },
        timestamp: new Date().toISOString()
      };

      logger.info('System status requested', { status });
      return ResponseHandler.success(res, 'System status retrieved', status);

    } catch (error) {
      logger.error('Status check failed', { error: error.message });
      return ResponseHandler.error(res, 'Status check failed', error);
    }
  }
}

module.exports = HealthController;