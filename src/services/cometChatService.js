/**
 * CometChat Service
 * Handles all CometChat-related business logic
 */

const logger = require('../utils/logger');
const config = require('../config');

class CometChatService {
  constructor() {
    this.appId = config.cometchat.appId;
    this.region = config.cometchat.region;
    this.apiKey = config.cometchat.apiKey;
  }

  /**
   * Process incoming CometChat webhook
   */
  async processWebhook(webhookData) {
    try {
      const { trigger, data, appId } = webhookData;

      logger.cometchat('webhook_received', {
        trigger,
        appId,
        hasMessageData: !!(data && data.message)
      });

      // Process different types of webhooks
      switch (trigger) {
        case 'message_sent':
        case 'onMessageSent':
          return await this.handleMessageSent(data);
        case 'message_delivered':
        case 'onMessageDelivered':
          return await this.handleMessageDelivered(data);
        case 'message_read':
        case 'onMessageRead':
          return await this.handleMessageRead(data);
        case 'user_online':
        case 'onUserOnline':
          return await this.handleUserOnline(data);
        case 'user_offline':
        case 'onUserOffline':
          return await this.handleUserOffline(data);
        default:
          logger.warn('Unknown CometChat webhook trigger', { trigger });
          return { processed: false, reason: 'Unknown trigger type' };
      }

    } catch (error) {
      logger.error('Error processing CometChat webhook', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle message sent event
   */
  async handleMessageSent(data) {
    // Handle both data.message format and direct data format
    const message = data.message || data;
    
    if (!message || (!message.text && !message.data)) {
      logger.warn('Message sent webhook missing message data', { data });
      return { processed: false, reason: 'Missing message data' };
    }

    logger.cometchat('message_sent', {
      messageId: message.id,
      sender: message.sender?.uid,
      receiver: message.receiver,
      messageType: message.type,
      category: message.category
    });

    // Add your message processing logic here
    // For example: save to database, forward to other services, etc.

    return {
      processed: true,
      messageId: message.id,
      action: 'message_processed'
    };
  }

  /**
   * Handle message delivered event
   */
  async handleMessageDelivered(data) {
    const { message } = data;
    
    logger.cometchat('message_delivered', {
      messageId: message?.id,
      deliveredAt: message?.deliveredAt
    });

    return {
      processed: true,
      messageId: message?.id,
      action: 'delivery_processed'
    };
  }

  /**
   * Handle message read event
   */
  async handleMessageRead(data) {
    const { message } = data;
    
    logger.cometchat('message_read', {
      messageId: message?.id,
      readAt: message?.readAt
    });

    return {
      processed: true,
      messageId: message?.id,
      action: 'read_receipt_processed'
    };
  }

  /**
   * Handle user online event
   */
  async handleUserOnline(data) {
    const { user } = data;
    
    logger.cometchat('user_online', {
      userId: user?.uid,
      onlineAt: new Date().toISOString()
    });

    return {
      processed: true,
      userId: user?.uid,
      action: 'user_online_processed'
    };
  }

  /**
   * Handle user offline event
   */
  async handleUserOffline(data) {
    const { user } = data;
    
    logger.cometchat('user_offline', {
      userId: user?.uid,
      offlineAt: new Date().toISOString()
    });

    return {
      processed: true,
      userId: user?.uid,
      action: 'user_offline_processed'
    };
  }

  /**
   * Send message via CometChat API (future implementation)
   */
  async sendMessage(receiverUid, messageText, receiverType = 'user') {
    logger.cometchat('send_message_attempt', {
      receiver: receiverUid,
      receiverType,
      messageLength: messageText.length
    });

    // TODO: Implement CometChat API call to send message
    // This would require the CometChat REST API integration

    return {
      sent: false,
      reason: 'API integration not implemented yet'
    };
  }
}

module.exports = new CometChatService();