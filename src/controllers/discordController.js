/**
 * Discord Controller
 * Handles Discord webhook endpoints and API interactions
 */

const ResponseHandler = require('../utils/response');
const discordService = require('../services/discordService');
const logger = require('../utils/logger');

class DiscordController {
  /**
   * GET /discord - Get Discord service info
   */
  static async getInfo(req, res) {
    try {
      const info = {
        service: 'CometChat Discord Integration',
        status: 'active',
        version: '1.0.0',
        endpoints: {
          webhook: 'POST /discord',
          info: 'GET /discord'
        }
      };

      logger.discord('info_requested', info);
      return ResponseHandler.success(res, 'Discord service information', info);

    } catch (error) {
      logger.error('Discord info request failed', { error: error.message });
      return ResponseHandler.error(res, 'Failed to get Discord info', error);
    }
  }

  /**
   * POST /discord - Handle Discord webhooks
   */
  static async handleWebhook(req, res) {
    try {
      const { body } = req;

      // Process the webhook through the service (logging handled in middleware)
      const result = await discordService.processWebhook(body);

      // Return success response with processing result
      return ResponseHandler.webhook(res, 'Discord', {
        ...result,
        eventId: body.id
      });

    } catch (error) {
      logger.error('❌ Error processing Discord webhook:', { error: error.message });
      return ResponseHandler.error(res, 'Error processing Discord data', error);
    }
  }
}

module.exports = DiscordController;