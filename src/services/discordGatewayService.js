/**
 * Discord Gateway Service
 * Handles real-time Discord message events via WebSocket Gateway
 * Follows the same architecture pattern as other services
 */

const { Client, GatewayIntentBits, Events } = require('discord.js');
const logger = require('../utils/logger');
const config = require('../config');

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
   * Handle incoming Discord message - Following existing service patterns
   */
  async handleMessage(message) {
    try {
      // Skip bot messages to prevent loops (same as Telegram service pattern)
      if (message.author.bot) {
        logger.debug('Skipping bot message', { authorId: message.author.id });
        return;
      }

      // Skip empty messages
      if (!message.content && message.attachments.size === 0) {
        logger.debug('Skipping empty message', { messageId: message.id });
        return;
      }

      // Create standardized message data (following service patterns)
      const messageData = {
        id: message.id,
        content: message.content,
        author: {
          id: message.author.id,
          username: message.author.username,
          displayName: message.author.displayName || message.author.username,
          avatar: message.author.displayAvatarURL()
        },
        channel: {
          id: message.channelId,
          name: message.channel.name,
          type: message.channel.type
        },
        guild: {
          id: message.guildId,
          name: message.guild?.name
        },
        timestamp: message.createdTimestamp,
        attachments: message.attachments.map(att => ({
          id: att.id,
          name: att.name,
          url: att.url,
          size: att.size,
          contentType: att.contentType
        })),
        mentions: message.mentions.users.map(user => ({
          id: user.id,
          username: user.username
        })),
        isReply: !!message.reference,
        replyTo: message.reference ? {
          messageId: message.reference.messageId,
          channelId: message.reference.channelId
        } : null
      };

      // Log message using same pattern as other services
      logger.discord('message_received', {
        messageId: message.id,
        authorId: message.author.id,
        authorName: message.author.username,
        channelId: message.channelId,
        channelName: message.channel.name,
        guildId: message.guildId,
        guildName: message.guild?.name,
        contentLength: message.content.length,
        hasAttachments: message.attachments.size > 0,
        contentPreview: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '')
      });

      // Console log for immediate visibility (as requested)
      console.log('\n🎭 DISCORD MESSAGE RECEIVED:');
      console.log(`📅 Time: ${new Date(messageData.timestamp).toLocaleString()}`);
      console.log(`👤 Author: ${messageData.author.displayName} (@${messageData.author.username})`);
      console.log(`🏠 Server: ${messageData.guild.name || 'DM'}`);
      console.log(`📢 Channel: #${messageData.channel.name || 'Direct Message'}`);
      console.log(`💬 Content: ${messageData.content || '[No text content]'}`);
      if (messageData.attachments.length > 0) {
        console.log(`📎 Attachments: ${messageData.attachments.length}`);
      }
      if (messageData.mentions.length > 0) {
        console.log(`@️⃣ Mentions: ${messageData.mentions.map(u => u.username).join(', ')}`);
      }
      console.log('─'.repeat(60));

      // TODO: Forward to other platforms (next phase)
      // await messageForwardingService.forwardDiscordMessage(messageData);

      return {
        processed: true,
        messageId: message.id,
        action: 'message_logged',
        platform: 'discord'
      };

    } catch (error) {
      logger.error('Error handling Discord message', { 
        messageId: message.id,
        error: error.message 
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