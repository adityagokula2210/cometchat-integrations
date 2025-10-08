/**
 * CometChat Controller
 * Handles CometChat webhook endpoints and API interactions
 */

const ResponseHandler = require('../utils/response');
const cometChatService = require('../services/cometChatService');
const logger = require('../utils/logger');

// Import message router for cross-platform messaging
const messageRouter = require('../services/messageRouterService');

// Import Tripetto service for healthcare workflows
const tripettoService = require('../services/tripettoService');

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
   * Handle Tripetto healthcare workflow
   * @param {string} userId - User ID
   * @param {string} messageText - Message text
   * @param {string} receiverType - Receiver type (user/group)
   * @param {string} receiverId - Receiver ID
   * @param {Object} res - Response object
   */
  static async handleTripettoWorkflow(userId, messageText, receiverType, receiverId, res) {
    try {
      logger.info('🏥 Starting Tripetto healthcare workflow', {
        userId,
        command: messageText,
        receiverType,
        receiverId
      });

      let tripettoResponse;

      // Check if user is continuing an existing conversation
      const hasActiveConversation = tripettoService.hasActiveConversation(userId);

      if (hasActiveConversation && messageText !== '/care') {
        // Continue existing conversation
        tripettoResponse = await tripettoService.processUserResponse(userId, messageText);
      } else {
        // Start new healthcare workflow
        tripettoResponse = await tripettoService.startWorkflow(userId, 'chronious-care');
      }

      // Send Tripetto response back to CometChat
      if (tripettoResponse && tripettoResponse.message) {
        await cometChatService.sendMessage(receiverId, tripettoResponse.message, receiverType);
        
        logger.info('✅ Tripetto response sent to CometChat', {
          userId,
          responseLength: tripettoResponse.message.length,
          conversationComplete: tripettoResponse.complete
        });
      }

      return ResponseHandler.success(res, {
        message: 'Tripetto workflow processed successfully',
        workflowComplete: tripettoResponse?.complete || false,
        userId
      });

    } catch (error) {
      logger.error('❌ Error in Tripetto workflow:', error);
      
      // Send error message to user
      const errorMessage = "Sorry, I'm having trouble accessing the healthcare system right now. Please try again later or contact support.";
      try {
        await cometChatService.sendMessage(receiverId, errorMessage, receiverType);
      } catch (sendError) {
        logger.error('Failed to send error message to CometChat:', sendError);
      }

      return ResponseHandler.error(res, 'Failed to process healthcare workflow', 500);
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

      // Check for Tripetto healthcare workflow triggers
      if (body.trigger === 'after_message' && body.data) {
        const messageData = body.data.message || body.data;
        const messageText = messageData.text || messageData.data?.text;
        const senderId = messageData.sender || messageData.data?.entities?.sender?.entity?.uid;
        const receiverType = messageData.receiverType || 'user';
        const receiverId = messageData.receiver || messageData.receiverUid;

        // Check for Tripetto triggers
        if (messageText && (messageText.startsWith('/care') || tripettoService.hasActiveConversation(senderId))) {
          logger.info('🏥 Tripetto workflow trigger detected', {
            userId: senderId,
            messageText: messageText.substring(0, 50) + '...',
            isActiveConversation: tripettoService.hasActiveConversation(senderId)
          });

          return await CometChatController.handleTripettoWorkflow(
            senderId, 
            messageText, 
            receiverType, 
            receiverId, 
            res
          );
        }
      }

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




