/**
 * Discord API Service
 * Handles sending messages to Discord using REST API
 */

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const logger = require('../utils/logger');
const config = require('../config');

class DiscordApiService {
  constructor() {
    this.botToken = config.discord.botToken;
    this.applicationId = config.discord.applicationId;
    
    if (!this.botToken) {
      logger.error('Discord bot token not configured');
      return;
    }

    // Initialize Discord REST client
    this.rest = new REST({ version: '10' }).setToken(this.botToken);

    logger.info('Discord API service initialized', {
      hasToken: !!this.botToken,
      hasApplicationId: !!this.applicationId
    });
  }

  /**
   * Send text message to Discord channel
   * @param {string} channelId - Discord channel ID
   * @param {Object} message - Message object with text and metadata
   */
  async sendMessage(channelId, message) {
    try {
      if (!this.botToken) {
        throw new Error('Discord bot token not configured');
      }

      const messageContent = typeof message === 'string' ? message : message.text;
      
      const payload = {
        content: messageContent,
        allowed_mentions: {
          parse: [] // Disable all mentions to prevent spam
        }
      };

      const response = await this.rest.post(Routes.channelMessages(channelId), {
        body: payload
      });

      logger.info('Message sent to Discord', {
        channelId,
        messageId: response.id,
        contentLength: messageContent.length
      });

      return {
        success: true,
        messageId: response.id,
        platform: 'discord',
        channelId
      };

    } catch (error) {
      logger.error('Failed to send Discord message', {
        channelId,
        error: error.message,
        status: error.status,
        code: error.code
      });

      throw error;
    }
  }

  /**
   * Send embed message to Discord channel
   * @param {string} channelId - Discord channel ID
   * @param {Object} embedData - Embed data
   */
  async sendEmbed(channelId, embedData) {
    try {
      if (!this.botToken) {
        throw new Error('Discord bot token not configured');
      }

      const payload = {
        embeds: [embedData],
        allowed_mentions: {
          parse: []
        }
      };

      const response = await this.rest.post(Routes.channelMessages(channelId), {
        body: payload
      });

      logger.info('Embed sent to Discord', {
        channelId,
        messageId: response.id,
        embedTitle: embedData.title
      });

      return {
        success: true,
        messageId: response.id,
        platform: 'discord',
        channelId
      };

    } catch (error) {
      logger.error('Failed to send Discord embed', {
        channelId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Send file to Discord channel
   * @param {string} channelId - Discord channel ID
   * @param {string} fileUrl - URL of the file
   * @param {string} filename - Name of the file
   * @param {string} content - Optional message content
   */
  async sendFile(channelId, fileUrl, filename, content = '') {
    try {
      if (!this.botToken) {
        throw new Error('Discord bot token not configured');
      }

      // For now, send as URL in message content
      // TODO: Implement proper file upload with FormData
      const messageContent = content ? 
        `${content}\n${fileUrl}` : 
        `📎 ${filename}: ${fileUrl}`;

      return await this.sendMessage(channelId, messageContent);

    } catch (error) {
      logger.error('Failed to send Discord file', {
        channelId,
        fileUrl,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Edit a message in Discord channel
   * @param {string} channelId - Discord channel ID
   * @param {string} messageId - Message ID to edit
   * @param {string} content - New message content
   */
  async editMessage(channelId, messageId, content) {
    try {
      if (!this.botToken) {
        throw new Error('Discord bot token not configured');
      }

      const payload = {
        content: content,
        allowed_mentions: {
          parse: []
        }
      };

      const response = await this.rest.patch(Routes.channelMessage(channelId, messageId), {
        body: payload
      });

      logger.info('Discord message edited', {
        channelId,
        messageId,
        contentLength: content.length
      });

      return {
        success: true,
        messageId: response.id,
        platform: 'discord',
        channelId
      };

    } catch (error) {
      logger.error('Failed to edit Discord message', {
        channelId,
        messageId,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Get channel information
   * @param {string} channelId - Discord channel ID
   */
  async getChannelInfo(channelId) {
    try {
      const response = await this.rest.get(Routes.channel(channelId));
      return response;
    } catch (error) {
      logger.error('Failed to get Discord channel info', {
        channelId,
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
      // Test by getting bot user info
      const response = await this.rest.get(Routes.user('@me'));
      logger.info('Discord API connection test successful', {
        botUsername: response.username,
        botId: response.id
      });
      return true;
    } catch (error) {
      logger.error('Discord API connection test failed', {
        error: error.message,
        status: error.status
      });
      return false;
    }
  }

  /**
   * Format message for Discord
   * @param {Object} sourceMessage - Original message
   */
  formatMessage(sourceMessage) {
    const author = sourceMessage.author.name;
    const content = sourceMessage.content.text;
    const sourcePlatform = sourceMessage.source.charAt(0).toUpperCase() + sourceMessage.source.slice(1);
    
    // Format for Discord with platform emoji
    const platformEmojis = {
      telegram: '📱',
      cometchat: '💬',
      discord: '🎮'
    };
    
    const emoji = platformEmojis[sourceMessage.source] || '🌐';
    const formattedContent = `${emoji} **[${sourcePlatform}]** ${author}: ${content}`;
    
    return {
      text: formattedContent
    };
  }

  /**
   * Create embed for rich message display
   * @param {Object} sourceMessage - Original message
   */
  createEmbed(sourceMessage) {
    const author = sourceMessage.author.name;
    const content = sourceMessage.content.text;
    const sourcePlatform = sourceMessage.source.charAt(0).toUpperCase() + sourceMessage.source.slice(1);
    
    const platformColors = {
      telegram: 0x0088CC, // Telegram blue
      cometchat: 0x6C5CE7, // CometChat purple
      discord: 0x5865F2   // Discord blurple
    };

    return {
      title: `Message from ${sourcePlatform}`,
      description: content,
      color: platformColors[sourceMessage.source] || 0x99AAB5,
      author: {
        name: author
      },
      timestamp: sourceMessage.timestamp || new Date().toISOString(),
      footer: {
        text: `Via ${sourcePlatform} Bridge`
      }
    };
  }
}

// Export singleton instance
module.exports = new DiscordApiService();