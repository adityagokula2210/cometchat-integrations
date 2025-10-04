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
        version: '2.0.0',
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

      // Log the full webhook payload
      logger.info('📥 Received CometChat POST request:');
      logger.info('Timestamp:', new Date().toISOString());
      logger.info('Full Body:', JSON.stringify(body, null, 2));
      logger.info('Headers:', JSON.stringify(req.headers, null, 2));
      
      // Log specific CometChat webhook details
      if (body.trigger) {
        logger.info('🔔 Webhook Trigger:', body.trigger);
      }
      if (body.data && body.data.message) {
        logger.info('💬 Message Details:', JSON.stringify(body.data.message, null, 2));
      }
      if (body.appId) {
        logger.info('📱 App ID:', body.appId);
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