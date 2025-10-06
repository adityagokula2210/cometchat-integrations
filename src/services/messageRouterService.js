/**
 * Message Router Service
 * Central hub for routing messages between platforms using bridge configuration
 */

const logger = require('../utils/logger');
const bridgeConfig = require('./bridgeConfigService');

class MessageRouterService {
  constructor() {
    // Will be initialized with API services when they're created
    this.telegramService = null;
    this.discordService = null;
    this.cometChatService = null;
    
    logger.info('Message router service initialized');
  }

  /**
   * Initialize with platform API services
   * @param {Object} services - Object containing platform services
   */
  initialize(services) {
    this.telegramService = services.telegram;
    this.discordService = services.discord;
    this.cometChatService = services.cometchat;
    
    logger.info('Message router services connected', {
      telegram: !!this.telegramService,
      discord: !!this.discordService,
      cometchat: !!this.cometChatService
    });
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
      const formattedMessage = this.formatMessageForPlatform(target.platform, message);
      
      switch (target.platform) {
        case 'discord':
          if (this.discordService) {
            await this.discordService.sendMessage(target.channelId, formattedMessage);
          } else {
            logger.warn('Discord service not available');
          }
          break;

        case 'telegram':
          if (this.telegramService) {
            await this.telegramService.sendMessage(target.chatId, formattedMessage);
          } else {
            logger.warn('Telegram service not available');
          }
          break;

        case 'cometchat':
          if (this.cometChatService) {
            await this.cometChatService.sendMessage(target.groupId, formattedMessage);
          } else {
            logger.warn('CometChat service not available');
          }
          break;

        default:
          logger.warn('Unknown target platform', { platform: target.platform });
      }

      logger.debug('Message sent to target', {
        platform: target.platform,
        targetId: target.channelId || target.chatId || target.groupId
      });

    } catch (error) {
      logger.error('Failed to send to target platform', {
        platform: target.platform,
        error: error.message,
        targetId: target.channelId || target.chatId || target.groupId
      });
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
   * Get routing statistics
   */
  getStats() {
    return {
      bridgeConfig: bridgeConfig.getConfigSummary(),
      servicesConnected: {
        telegram: !!this.telegramService,
        discord: !!this.discordService,
        cometchat: !!this.cometChatService
      }
    };
  }
}

// Export singleton instance
module.exports = new MessageRouterService();