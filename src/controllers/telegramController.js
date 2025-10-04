/**
 * Telegram Controller
 * Handles Telegram webhook endpoints and API interactions
 */

const ResponseHandler = require('../utils/response');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');

class TelegramController {
  /**
   * GET /telegram - Get Telegram service info
   */
  static async getInfo(req, res) {
    try {
      const info = {
        service: 'CometChat Telegram Integration',
        status: 'active',
        version: '2.0.1',
        endpoints: {
          webhook: 'POST /telegram',
          info: 'GET /telegram'
        }
      };

      logger.telegram('info_requested', info);
      return ResponseHandler.success(res, 'Telegram service information', info);

    } catch (error) {
      logger.error('Telegram info request failed', { error: error.message });
      return ResponseHandler.error(res, 'Failed to get Telegram info', error);
    }
  }

  /**
   * POST /telegram - Handle Telegram webhooks
   */
  static async handleWebhook(req, res) {
    try {
      const { body } = req;

      // Log the webhook payload
      logger.telegram('webhook_received', {
        updateId: body.update_id,
        hasMessage: !!body.message,
        hasCallbackQuery: !!body.callback_query,
        bodySize: JSON.stringify(body).length
      });

      // Process the webhook through the service
      const result = await telegramService.processWebhook(body);

      // Return success response with processing result
      return ResponseHandler.webhook(res, 'Telegram', {
        ...result,
        updateId: body.update_id
      });

    } catch (error) {
      logger.error('❌ Error processing Telegram POST:', error);
      return ResponseHandler.error(res, 'Error processing Telegram data', error);
    }
  }
}

module.exports = TelegramController;