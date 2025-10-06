/**
 * Telegram Controller
 * Handles Telegram webhook endpoints and API interactions
 */

const ResponseHandler = require('../utils/response');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');

// Import message router for cross-platform messaging
const messageRouter = require('../services/messageRouterService');

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

      // Process the webhook through the service (logging handled in middleware)
      const result = await telegramService.processWebhook(body);

      // Route message to other platforms if it's a valid message
      if (body.message && body.message.text && !body.message.from.is_bot) {
        await TelegramController.routeMessage(body.message);
      }

      // Return success response with processing result
      return ResponseHandler.webhook(res, 'Telegram', {
        ...result,
        updateId: body.update_id
      });

    } catch (error) {
      logger.error('❌ Error processing Telegram webhook:', { error: error.message });
      return ResponseHandler.error(res, 'Error processing Telegram data', error);
    }
  }

  /**
   * Convert Telegram message to standard format and route to other platforms
   * @param {Object} telegramMessage - Telegram message object
   */
  static async routeMessage(telegramMessage) {
    try {
      // Convert to standard message format
      const standardMessage = {
        id: `telegram_${telegramMessage.message_id}`,
        source: 'telegram',
        author: {
          id: telegramMessage.from.id.toString(),
          name: telegramMessage.from.username || `${telegramMessage.from.first_name} ${telegramMessage.from.last_name || ''}`.trim(),
          displayName: telegramMessage.from.first_name,
          isBot: telegramMessage.from.is_bot || false,
          avatar: null // Telegram doesn't provide avatar URLs in webhooks
        },
        content: {
          text: telegramMessage.text,
          attachments: [], // TODO: Handle Telegram attachments
          entities: telegramMessage.entities || []
        },
        channel: {
          id: telegramMessage.chat.id.toString(),
          name: telegramMessage.chat.title || telegramMessage.chat.username || 'Private Chat',
          type: telegramMessage.chat.type
        },
        timestamp: new Date(telegramMessage.date * 1000),
        platform: {
          messageUrl: null // Telegram doesn't provide direct message URLs
        }
      };

      // Route to message router
      await messageRouter.routeMessage(standardMessage);
      
    } catch (error) {
      logger.error('Failed to route Telegram message', {
        messageId: telegramMessage.message_id,
        error: error.message,
        stack: error.stack
      });
    }
  }
}

module.exports = TelegramController;