/**
 * CometChat API Service
 * Handles sending messages to CometChat using REST API
 */

const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

class CometChatApiService {
  constructor() {
    this.appId = config.cometchat.appId;
    this.region = config.cometchat.region;
    this.apiKey = config.cometchat.apiKey;
    this.baseUrl = `https://${this.appId}.api-${this.region}.cometchat.io/v3`;
    
    if (!this.apiKey) {
      logger.error('CometChat API key not configured');
      return;
    }

    // Set up axios defaults
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'apikey': this.apiKey
      }
    });

    logger.info('CometChat API service initialized', {
      appId: this.appId,
      region: this.region,
      hasApiKey: !!this.apiKey
    });
  }

  /**
   * Send bot message to CometChat group
   * Uses the Bot Message API for message bridging scenarios
   * @param {string} groupId - CometChat group ID
   * @param {Object} message - Message object with text and metadata
   */
  async sendMessage(groupId, message) {
    try {
      if (!this.apiKey) {
        throw new Error('CometChat API key not configured');
      }

      const messageText = typeof message === 'string' ? message : message.text;
      
      // Bot message payload structure according to CometChat docs
      const payload = {
        category: 'message',
        type: 'text',
        data: {
          text: messageText
        },
        sender: 'cometchat_bot',
        receiver: groupId,
        receiverType: 'group',
        metadata: {
          source: 'bridge',
          originalPlatform: message.originalMessage?.source || 'unknown',
          bridgeTimestamp: new Date().toISOString(),
          originalAuthor: message.originalMessage?.author?.name,
          originalMessageId: message.originalMessage?.id
        }
      };

      // Use bot message endpoint: /bots/{botId}/messages
      const response = await this.client.post('/bots/cometchat_bot/messages', payload);

      logger.info('Bot message sent to CometChat', {
        groupId,
        messageId: response.data.data.id,
        textLength: messageText.length,
        originalPlatform: message.originalMessage?.source,
        originalAuthor: message.originalMessage?.author?.name
      });

      return {
        success: true,
        messageId: response.data.data.id,
        platform: 'cometchat',
        groupId,
        messageType: 'bot'
      };

    } catch (error) {
      logger.error('Failed to send CometChat bot message', {
        groupId,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // Log detailed error for debugging
      if (error.response?.data) {
        logger.debug('CometChat API error details', {
          errorData: error.response.data,
          statusCode: error.response.status,
          headers: error.response.headers
        });
      }

      throw error;
    }
  }

  /**
   * Send media message to CometChat group
   * @param {string} groupId - CometChat group ID
   * @param {string} mediaUrl - URL of the media
   * @param {string} mediaType - Type of media (image, file, etc.)
   * @param {string} caption - Media caption
   */
  async sendMediaMessage(groupId, mediaUrl, mediaType = 'image', caption = '') {
    try {
      if (!this.apiKey) {
        throw new Error('CometChat API key not configured');
      }

      const payload = {
        category: 'message',
        type: mediaType,
        data: {
          url: mediaUrl,
          caption: caption
        },
        metadata: {
          source: 'bridge'
        }
      };

      const response = await this.client.post(`/groups/${groupId}/messages`, payload);

      logger.info('Media message sent to CometChat', {
        groupId,
        messageId: response.data.data.id,
        mediaUrl,
        mediaType
      });

      return {
        success: true,
        messageId: response.data.data.id,
        platform: 'cometchat',
        groupId
      };

    } catch (error) {
      logger.error('Failed to send CometChat media message', {
        groupId,
        mediaUrl,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Send message to specific user
   * @param {string} userId - CometChat user ID
   * @param {Object} message - Message object
   */
  async sendUserMessage(userId, message) {
    try {
      if (!this.apiKey) {
        throw new Error('CometChat API key not configured');
      }

      const messageText = typeof message === 'string' ? message : message.text;
      
      const payload = {
        category: 'message',
        type: 'text',
        data: {
          text: messageText
        },
        metadata: {
          source: 'bridge',
          originalPlatform: message.originalMessage?.source || 'unknown'
        }
      };

      const response = await this.client.post(`/users/${userId}/messages`, payload);

      logger.info('User message sent to CometChat', {
        userId,
        messageId: response.data.data.id,
        textLength: messageText.length
      });

      return {
        success: true,
        messageId: response.data.data.id,
        platform: 'cometchat',
        userId
      };

    } catch (error) {
      logger.error('Failed to send CometChat user message', {
        userId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Get group information
   * @param {string} groupId - CometChat group ID
   */
  async getGroupInfo(groupId) {
    try {
      const response = await this.client.get(`/groups/${groupId}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get CometChat group info', {
        groupId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user information
   * @param {string} userId - CometChat user ID
   */
  async getUserInfo(userId) {
    try {
      const response = await this.client.get(`/users/${userId}`);
      return response.data.data;
    } catch (error) {
      logger.error('Failed to get CometChat user info', {
        userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Test if service is working
   */
  async testConnection() {
    try {
      // Test by getting app details (using app info endpoint)
      const response = await this.client.get('/app');
      logger.info('CometChat API connection test successful', {
        appId: response.data.data.id,
        appName: response.data.data.name
      });
      return true;
    } catch (error) {
      logger.error('CometChat API connection test failed', {
        error: error.message,
        status: error.response?.status
      });
      return false;
    }
  }

  /**
   * Format message for CometChat Bot Message API
   * @param {Object} sourceMessage - Original message
   */
  formatMessage(sourceMessage) {
    const author = sourceMessage.author.name;
    const content = sourceMessage.content.text;
    const sourcePlatform = sourceMessage.source.charAt(0).toUpperCase() + sourceMessage.source.slice(1);
    
    // Format for CometChat with platform prefix and emoji
    const platformEmoji = {
      discord: '🎮',
      telegram: '✈️',
      cometchat: '💬'
    };
    
    const emoji = platformEmoji[sourceMessage.source] || '🔗';
    const formattedContent = `${emoji} **${sourcePlatform}** | ${author}:\n${content}`;
    
    return {
      text: formattedContent,
      originalMessage: sourceMessage,
      metadata: {
        source: 'bridge',
        originalPlatform: sourceMessage.source,
        originalAuthor: author,
        originalMessageId: sourceMessage.id,
        bridgeTimestamp: new Date().toISOString()
      }
    };
  }
}

// Export singleton instance
module.exports = new CometChatApiService();