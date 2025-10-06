/**
 * Message Router Service
 * Central hub for routing messages between platforms using bridge configuration
 */

const logger = require('../utils/logger');
const bridgeConfig = require('./bridgeConfigService');

// Import API services
const telegramApiService = require('./telegramApiService');
const cometChatApiService = require('./cometChatApiService');
const discordApiService = require('./discordApiService');

class MessageRouterService {
  constructor() {
    // Initialize with API services
    this.telegramService = telegramApiService;
    this.discordService = discordApiService;
    this.cometChatService = cometChatApiService;
    
    logger.info('Message router service initialized with API services', {
      telegram: !!this.telegramService,
      discord: !!this.discordService,
      cometchat: !!this.cometChatService
    });
  }

  /**
   * Get routing statistics and test API connections
   */
  async getStats() {
    const stats = {
      bridgeConfig: bridgeConfig.getConfigSummary(),
      servicesConnected: {
        telegram: !!this.telegramService,
        discord: !!this.discordService,
        cometchat: !!this.cometChatService
      },
      connectionTests: {}
    };

    // Test API connections
    try {
      stats.connectionTests.telegram = await this.telegramService.testConnection();
    } catch (error) {
      stats.connectionTests.telegram = false;
    }

    try {
      stats.connectionTests.discord = await this.discordService.testConnection();
    } catch (error) {
      stats.connectionTests.discord = false;
    }

    try {
      stats.connectionTests.cometchat = await this.cometChatService.testConnection();
    } catch (error) {
      stats.connectionTests.cometchat = false;
    }

    return stats;
  }

  /**
   * Route a message from source platform to target platforms
   * @param {Object} message - Standardized message object
   */
  async routeMessage(message) {
    try {
      // Validate message
      if (!this.isValidMessage(message)) {
        logger.warn('Invalid message format', { message });
        return;
      }

      // Prevent routing bot messages to avoid loops
      if (this.isBotMessage(message)) {
        logger.debug('Skipping bot message to prevent loops', {
          platform: message.source,
          author: message.author.name
        });
        return;
      }

      // Get target platforms for this message
      const sourceId = this.extractPlatformId(message);
      const targets = bridgeConfig.getTargetPlatforms(message.source, sourceId);

      if (targets.length === 0) {
        logger.debug('No bridge targets found for message', {
          source: message.source,
          sourceId
        });
        return;
      }

      // Route to each target platform
      const routingPromises = targets.map(target => 
        this.sendToTarget(target, message)
      );

      await Promise.allSettled(routingPromises);

      logger.info('Message routed successfully', {
        source: message.source,
        sourceId,
        targetCount: targets.length,
        messageId: message.id
      });

    } catch (error) {
      logger.error('Message routing failed', {
        error: error.message,
        message,
        stack: error.stack
      });
    }
  }

  /**
   * Send message to a target platform
   * @param {Object} target - Target platform configuration
   * @param {Object} message - Source message
   */
  async sendToTarget(target, message) {
    try {
      let formattedMessage;
      let result;
      
      switch (target.platform) {
        case 'discord':
          formattedMessage = this.discordService.formatMessage(message);
          result = await this.discordService.sendMessage(target.channelId, formattedMessage);
          break;

        case 'telegram':
          formattedMessage = this.telegramService.formatMessage(message);
          result = await this.telegramService.sendMessage(target.chatId, formattedMessage);
          break;

        case 'cometchat':
          formattedMessage = this.cometChatService.formatMessage(message);
          result = await this.cometChatService.sendMessage(target.groupId, formattedMessage);
          break;

        default:
          logger.warn('Unknown target platform', { platform: target.platform });
          return;
      }

      logger.debug('Message sent to target', {
        platform: target.platform,
        targetId: target.channelId || target.chatId || target.groupId,
        messageId: result.messageId
      });

      return result;

    } catch (error) {
      logger.error('Failed to send to target platform', {
        platform: target.platform,
        error: error.message,
        targetId: target.channelId || target.chatId || target.groupId
      });
      
      // Don't throw error to prevent one platform failure from stopping others
      return {
        success: false,
        error: error.message,
        platform: target.platform
      };
    }
  }

  /**
   * Extract platform-specific ID from message
   * @param {Object} message - Message object
   */
  extractPlatformId(message) {
    switch (message.source) {
      case 'discord':
        return message.channel.id;
      case 'telegram':
        return message.channel.id; // chat.id
      case 'cometchat':
        return message.channel.id; // group.id or receiver.id
      default:
        return null;
    }
  }

  /**
   * Format message for target platform
   * @param {string} targetPlatform - Target platform name
   * @param {Object} message - Source message
   */
  formatMessageForPlatform(targetPlatform, message) {
    // Basic formatting for now
    // TODO: Implement platform-specific formatting
    
    const author = message.author.name;
    const content = message.content.text;
    const sourcePlatform = message.source.charAt(0).toUpperCase() + message.source.slice(1);
    
    // Add platform prefix to show message origin
    const formattedContent = `[${sourcePlatform}] ${author}: ${content}`;
    
    return {
      text: formattedContent,
      originalMessage: message
    };
  }

  /**
   * Check if message is valid for routing
   * @param {Object} message - Message to validate
   */
  isValidMessage(message) {
    return (
      message &&
      message.source &&
      message.author &&
      message.author.name &&
      message.content &&
      message.content.text &&
      message.channel &&
      message.channel.id
    );
  }

  /**
   * Check if message is from a bot to prevent loops
   * @param {Object} message - Message to check
   */
  isBotMessage(message) {
    // Simple bot detection - can be enhanced
    const botNames = [
      'cometchat bot',
      'cometchat-bot', 
      'telegram bot',
      'discord bot',
      'bot'
    ];
    
    const authorName = message.author.name.toLowerCase();
    return botNames.some(botName => authorName.includes(botName)) || 
           message.author.isBot === true;
  }

  /**
   * Get routing statistics and test API connections
   */
  async getStats() {
    const stats = {
      bridgeConfig: bridgeConfig.getConfigSummary(),
      servicesConnected: {
        telegram: !!this.telegramService,
        discord: !!this.discordService,
        cometchat: !!this.cometChatService
      },
      connectionTests: {}
    };

    // Test API connections
    try {
      stats.connectionTests.telegram = await this.telegramService.testConnection();
    } catch (error) {
      stats.connectionTests.telegram = false;
    }

    try {
      stats.connectionTests.discord = await this.discordService.testConnection();
    } catch (error) {
      stats.connectionTests.discord = false;
    }

    try {
      stats.connectionTests.cometchat = await this.cometChatService.testConnection();
    } catch (error) {
      stats.connectionTests.cometchat = false;
    }

    return stats;
  }
}

// Export singleton instance
module.exports = new MessageRouterService();