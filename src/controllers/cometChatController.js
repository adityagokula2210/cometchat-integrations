/**
 * CometChat Controller
 * Handles CometChat webhook endpoints and API interactions
 */

const ResponseHandler = require('../utils/response');
const cometChatService = require('../services/cometChatService');
const logger = require('../utils/logger');

class CometChatController {
  /**
   * GET /cometchat - Get CometChat service info
   */
  static async getInfo(req, res) {
    try {
      const info = {
        service: 'CometChat Integration',
        status: 'active',
        version: '2.0.1',
        endpoints: {
          webhook: 'POST /cometchat',
          info: 'GET /cometchat'
        }
      };

      logger.cometchat('info_requested', info);
      return ResponseHandler.success(res, 'CometChat service information', info);

    } catch (error) {
      logger.error('CometChat info request failed', { error: error.message });
      return ResponseHandler.error(res, 'Failed to get CometChat info', error);
    }
  }

  /**
   * POST /cometchat - Handle CometChat webhooks
   */
  static async handleWebhook(req, res) {
    try {
      const { body } = req;

      // Log the complete webhook payload with structured format
      logger.cometchat('webhook_received', {
        trigger: body.trigger,
        appId: body.appId,
        hasData: !!body.data,
        bodySize: JSON.stringify(body).length,
        fullPayload: body,  // Log the complete webhook data
        headers: req.headers
      });
      
      // Log specific message details if present
      if (body.data && body.data.message) {
        logger.cometchat('message_details', {
          messageId: body.data.message.id,
          messageType: body.data.message.type,
          sender: body.data.message.sender,
          receiver: body.data.message.receiver,
          text: body.data.message.text,
          category: body.data.message.category
        });
      }

      // Process the webhook through the service
      const result = await cometChatService.processWebhook(body);

      // Return success response with processing result
      return ResponseHandler.webhook(res, 'CometChat', {
        ...result,
        trigger: body.trigger,
        appId: body.appId
      });

    } catch (error) {
      logger.error('❌ Error processing CometChat POST:', error);
      return ResponseHandler.error(res, 'Error processing CometChat data', error);
    }
  }
}

module.exports = CometChatController;