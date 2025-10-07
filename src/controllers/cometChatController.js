/**
 * CometChat Controller
 * Handles CometChat webhook endpoints and API interactions
 */

const ResponseHandler = require('../utils/response');
const cometChatService = require('../services/cometChatService');
const logger = require('../utils/logger');

// Import message router for cross-platform messaging
const messageRouter = require('../services/messageRouterService');

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

      // Log essential webhook info
      logger.info('📨 CometChat webhook processing', {
        trigger: body.trigger,
        appId: body.appId,
        hasData: !!body.data
      });

      // Process the webhook through the service (logging handled in middleware)
      const result = await cometChatService.processWebhook(body);

      // Route message to other platforms if it's an after_message event
      if (body.trigger === 'after_message' && body.data) {
        // Handle both message wrapper and direct data formats
        const messageData = body.data.message || body.data;
        
        if (messageData && (messageData.text || messageData.data?.text)) {
          logger.info('🔄 Routing CometChat message', { trigger: body.trigger });
          await CometChatController.routeMessage(messageData);
        }
      }

      // Return success response with processing result
      return ResponseHandler.webhook(res, 'CometChat', {
        ...result,
        trigger: body.trigger,
        appId: body.appId
      });

    } catch (error) {
      logger.error('❌ Error processing CometChat webhook:', { error: error.message });
      return ResponseHandler.error(res, 'Error processing CometChat data', error);
    }
  }

  /**
   * Convert CometChat message to standard format and route to other platforms
   * @param {Object} cometChatMessage - CometChat message data
   */
  static async routeMessage(cometChatMessage) {
    try {
      // Handle different message text formats
      const messageText = cometChatMessage.text || 
                         cometChatMessage.data?.text || 
                         (typeof cometChatMessage.data === 'string' ? cometChatMessage.data : '');

      if (!messageText) {
        logger.warn('❌ CometChat message has no text content', { 
          messageId: cometChatMessage.id
        });
        return;
      }

      // Extract sender information from CometChat webhook payload
      const senderEntity = cometChatMessage.data?.entities?.sender?.entity;
      const senderId = cometChatMessage.sender || senderEntity?.uid || 'unknown';
      const senderName = senderEntity?.name || 'Unknown User';
      const senderAvatar = senderEntity?.avatar || null;

      // Convert to standard message format
      const standardMessage = {
        id: `cometchat_${cometChatMessage.id}`,
        source: 'cometchat',
        author: {
          id: senderId,
          name: senderName,
          displayName: senderName,
          isBot: false,
          avatar: senderAvatar
        },
        content: {
          text: messageText,
          attachments: cometChatMessage.attachments || [],
          metadata: cometChatMessage.metadata || {}
        },
        channel: {
          id: cometChatMessage.receiver || cometChatMessage.receiverUid,
          name: cometChatMessage.receiverType === 'group' ? 'Group Chat' : 'Direct Message',
          type: cometChatMessage.receiverType
        },
        timestamp: new Date(cometChatMessage.sentAt ? cometChatMessage.sentAt * 1000 : Date.now()),
        platform: {
          messageUrl: null // CometChat doesn't provide direct message URLs
        }
      };

      logger.info('✅ Message routed successfully', {
        messageId: standardMessage.id,
        author: standardMessage.author.name
      });

      // Route to message router
      await messageRouter.routeMessage(standardMessage);
      
    } catch (error) {
      logger.error('Failed to route CometChat message', {
        messageId: cometChatMessage.id,
        error: error.message,
        stack: error.stack
      });
    }
  }
}

module.exports = CometChatController;




