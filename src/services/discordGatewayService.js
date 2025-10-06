/**
 * Discord Gateway Service
 * Handles real-time Discord message events via WebSocket Gateway
 * Follows the same architecture pattern as other services
 */

const { Client, GatewayIntentBits, Events } = require('discord.js');
const logger = require('../utils/logger');
const config = require('../config');

// Import message router for cross-platform messaging
const messageRouter = require('./messageRouterService');

class DiscordGatewayService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.botToken = config.discord?.botToken;
  }

  /**
   * Initialize Discord Gateway Bot
   */
  async initialize() {
    try {
      if (!this.botToken) {
        logger.warn('Discord bot token not configured, skipping Gateway initialization');
        return;
      }

      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,                    // Access to guild info
          GatewayIntentBits.GuildMessages,             // Read guild messages
          GatewayIntentBits.MessageContent             // Read message content (REQUIRES PRIVILEGED INTENT)
        ]
      });

      // Setup event listeners
      this.setupEventListeners();

      // Login to Discord
      await this.client.login(this.botToken);
      
      logger.discord('gateway_initialized', {
        status: 'connected',
        botToken: this.botToken.substring(0, 20) + '...'
      });

    } catch (error) {
      logger.error('Discord Gateway initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup Discord event listeners
   */
  setupEventListeners() {
    // Bot ready event
    this.client.once(Events.ClientReady, (client) => {
      this.isConnected = true;
      logger.discord('gateway_ready', {
        botTag: client.user.tag,
        guilds: client.guilds.cache.size,
        users: client.users.cache.size
      });
    });

    // Message received event - Main functionality
    this.client.on(Events.MessageCreate, async (message) => {
      await this.handleMessage(message);
    });

    // Message updated event
    this.client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
      await this.handleMessageUpdate(oldMessage, newMessage);
    });

    // Message deleted event
    this.client.on(Events.MessageDelete, async (message) => {
      await this.handleMessageDelete(message);
    });

    // Error handling
    this.client.on('error', (error) => {
      logger.error('Discord Gateway error', { error: error.message });
    });

    // Disconnect handling
    this.client.on('disconnect', () => {
      this.isConnected = false;
      logger.warn('Discord Gateway disconnected');
    });
  }

  /**
   * Handle incoming Discord messages
   * @param {Object} message - Discord message object
   */
  async handleMessage(message) {
    // Skip messages from bots to prevent loops
    if (message.author.bot) {
      return;
    }

    // Log RAW message payload for debugging
    logger.discord('Raw Discord message payload', {
      rawMessage: {
        id: message.id,
        content: message.content,
        author: message.author,
        channel: message.channel,
        guild: message.guild,
        createdAt: message.createdAt,
        attachments: message.attachments,
        embeds: message.embeds
      }
    });

    // Log message with relevant details
    logger.discord('Message received', {
      messageId: message.id,
      author: {
        id: message.author.id,
        username: message.author.username,
        discriminator: message.author.discriminator
      },
      content: message.content,
      channel: {
        id: message.channel.id,
        name: message.channel.name,
        type: message.channel.type
      },
      guild: message.guild ? {
        id: message.guild.id,
        name: message.guild.name
      } : null,
      timestamp: message.createdAt
    });

    // Enhanced console log for development with prominent channel/guild IDs
    console.log(`\n🔥 DISCORD MESSAGE RECEIVED 🔥`);
    console.log(`� CHANNEL ID: ${message.channel.id}`);
    console.log(`🏰 GUILD ID: ${message.guild?.id || 'N/A'}`);
    console.log(`👤 Author: ${message.author.username}#${message.author.discriminator}`);
    console.log(`💬 Content: ${message.content}`);
    console.log(`� Channel: ${message.channel.name}`);
    console.log(`🏠 Guild: ${message.guild?.name || 'DM'}`);
    console.log(`⏰ Time: ${message.createdAt}`);
    console.log(`\n🔗 FOR BRIDGE CONFIG:`);
    console.log(`   channelId: '${message.channel.id}',`);
    console.log(`   guildId: '${message.guild?.id || 'N/A'}',`);
    console.log(`=====================================\n`);

    // Route message to other platforms
    await this.routeMessage(message);
  }

  /**
   * Convert Discord message to standard format and route to other platforms
   * @param {Object} discordMessage - Discord message object
   */
  async routeMessage(discordMessage) {
    try {
      // Convert to standard message format
      const standardMessage = {
        id: `discord_${discordMessage.id}`,
        source: 'discord',
        author: {
          id: discordMessage.author.id,
          name: `${discordMessage.author.username}#${discordMessage.author.discriminator}`,
          displayName: discordMessage.author.displayName || discordMessage.author.username,
          isBot: discordMessage.author.bot,
          avatar: discordMessage.author.displayAvatarURL()
        },
        content: {
          text: discordMessage.content,
          attachments: discordMessage.attachments.size > 0 ? 
            Array.from(discordMessage.attachments.values()).map(att => ({
              id: att.id,
              name: att.name,
              url: att.url,
              size: att.size,
              contentType: att.contentType
            })) : [],
          embeds: discordMessage.embeds.length > 0 ? discordMessage.embeds : []
        },
        channel: {
          id: discordMessage.channel.id,
          name: discordMessage.channel.name,
          type: discordMessage.channel.type
        },
        guild: discordMessage.guild ? {
          id: discordMessage.guild.id,
          name: discordMessage.guild.name
        } : null,
        timestamp: discordMessage.createdAt,
        platform: {
          messageUrl: `https://discord.com/channels/${discordMessage.guild?.id || '@me'}/${discordMessage.channel.id}/${discordMessage.id}`
        }
      };

      // Route to message router
      await messageRouter.routeMessage(standardMessage);
      
    } catch (error) {
      logger.error('Failed to route Discord message', {
        messageId: discordMessage.id,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Handle message updates
   */
  async handleMessageUpdate(oldMessage, newMessage) {
    try {
      // Skip bot messages
      if (newMessage.author?.bot) return;

      logger.discord('message_updated', {
        messageId: newMessage.id,
        authorId: newMessage.author?.id,
        channelId: newMessage.channelId
      });

      console.log('\n✏️ DISCORD MESSAGE EDITED:');
      console.log(`📝 Message ID: ${newMessage.id}`);
      console.log(`👤 Author: ${newMessage.author?.username}`);
      console.log(`📢 Channel: #${newMessage.channel?.name}`);
      console.log(`📄 New Content: ${newMessage.content}`);
      console.log('─'.repeat(60));

    } catch (error) {
      logger.error('Error handling Discord message update', { error: error.message });
    }
  }

  /**
   * Handle message deletions
   */
  async handleMessageDelete(message) {
    try {
      logger.discord('message_deleted', {
        messageId: message.id,
        channelId: message.channelId
      });

      console.log('\n🗑️ DISCORD MESSAGE DELETED:');
      console.log(`📝 Message ID: ${message.id}`);
      console.log(`📢 Channel: #${message.channel?.name}`);
      console.log('─'.repeat(60));

    } catch (error) {
      logger.error('Error handling Discord message delete', { error: error.message });
    }
  }

  /**
   * Send message to Discord channel (for future use)
   */
  async sendMessage(channelId, content, options = {}) {
    try {
      if (!this.isConnected) {
        throw new Error('Discord Gateway not connected');
      }

      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel) {
        throw new Error(`Channel ${channelId} not found`);
      }

      const message = await channel.send({
        content,
        ...options
      });

      logger.discord('message_sent', {
        messageId: message.id,
        channelId: channelId,
        contentLength: content.length
      });

      return message;

    } catch (error) {
      logger.error('Error sending Discord message', { 
        channelId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get Discord connection status (following health check pattern)
   */
  getStatus() {
    return {
      connected: this.isConnected,
      ready: this.client?.readyAt ? true : false,
      guilds: this.client?.guilds.cache.size || 0,
      ping: this.client?.ws.ping || -1,
      uptime: this.client?.uptime || 0
    };
  }

  /**
   * Gracefully shutdown Discord connection
   */
  async shutdown() {
    try {
      if (this.client) {
        await this.client.destroy();
        this.isConnected = false;
        logger.discord('gateway_shutdown', { status: 'disconnected' });
      }
    } catch (error) {
      logger.error('Error shutting down Discord Gateway', { error: error.message });
    }
  }
}

module.exports = new DiscordGatewayService();