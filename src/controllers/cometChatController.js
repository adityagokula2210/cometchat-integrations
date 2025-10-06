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

      // Log the complete CometChat webhook payload
      logger.info('📨 CometChat webhook payload received', {
        trigger: body.trigger,
        appId: body.appId,
        timestamp: new Date().toISOString(),
        fullPayload: body,
        dataKeys: body.data ? Object.keys(body.data) : [],
        hasMessageData: !!(body.data && (body.data.message || body.data.text || body.data.id))
      });

      // Process the webhook through the service (logging handled in middleware)
      const result = await cometChatService.processWebhook(body);

      // Route message to other platforms if it's a message event
      if ((body.trigger === 'onMessageSent' || body.trigger === 'message_sent' || body.trigger === 'after_message') && body.data) {
        // Handle both message wrapper and direct data formats
        const messageData = body.data.message || body.data;
        
        logger.info('🔄 CometChat message routing check', {
          trigger: body.trigger,
          hasData: !!body.data,
          hasMessageData: !!messageData,
          hasText: !!(messageData && (messageData.text || messageData.data?.text)),
          messageDataKeys: messageData ? Object.keys(messageData) : [],
          willRoute: !!(messageData && (messageData.text || messageData.data?.text))
        });
        
        if (messageData && (messageData.text || messageData.data?.text)) {
          await CometChatController.routeMessage(messageData);
        } else {
          logger.warn('❌ CometChat message not routed - missing text content', {
            messageData,
            hasMessageData: !!messageData,
            hasText: !!messageData?.text,
            hasDataText: !!messageData?.data?.text
          });
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
      // Log the complete message structure for analysis
      logger.info('📝 CometChat message format analysis', {
        messageId: cometChatMessage.id,
        hasText: !!cometChatMessage.text,
        hasDataText: !!cometChatMessage.data?.text,
        hasStringData: typeof cometChatMessage.data === 'string',
        dataType: typeof cometChatMessage.data,
        messageKeys: Object.keys(cometChatMessage),
        dataKeys: cometChatMessage.data ? Object.keys(cometChatMessage.data) : null,
        fullMessage: cometChatMessage
      });

      // Handle different message text formats
      const messageText = cometChatMessage.text || 
                         cometChatMessage.data?.text || 
                         (typeof cometChatMessage.data === 'string' ? cometChatMessage.data : '');

      if (!messageText) {
        logger.warn('❌ CometChat message has no text content to route', { 
          messageId: cometChatMessage.id,
          message: cometChatMessage,
          textSources: {
            directText: cometChatMessage.text,
            dataText: cometChatMessage.data?.text,
            stringData: typeof cometChatMessage.data === 'string' ? cometChatMessage.data : null
          }
        });
        return;
      }

      // Convert to standard message format
      const standardMessage = {
        id: `cometchat_${cometChatMessage.id}`,
        source: 'cometchat',
        author: {
          id: cometChatMessage.sender?.uid || 'unknown',
          name: cometChatMessage.sender?.name || 'Unknown User',
          displayName: cometChatMessage.sender?.name || 'Unknown User',
          isBot: false, // CometChat doesn't typically send bot info in webhooks
          avatar: cometChatMessage.sender?.avatar || null
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

      logger.info('Routing CometChat message', {
        messageId: standardMessage.id,
        author: standardMessage.author.name,
        textLength: messageText.length,
        receiverType: cometChatMessage.receiverType
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