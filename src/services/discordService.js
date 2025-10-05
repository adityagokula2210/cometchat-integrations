/**
 * Discord Service
 * Handles all Discord-related business logic
 */

const logger = require('../utils/logger');
const config = require('../config');

class DiscordService {
  constructor() {
    this.botToken = config.discord?.botToken;
    this.applicationId = config.discord?.applicationId;
  }

  /**
   * Process incoming Discord webhook
   */
  async processWebhook(webhookData) {
    try {
      const { type, data, id } = webhookData;

      // Handle different Discord event types
      switch (type) {
        case 1: // PING - Discord verification
          return await this.handlePing(webhookData);
        case 2: // APPLICATION_COMMAND
          return await this.handleSlashCommand(webhookData);
        case 3: // MESSAGE_COMPONENT (buttons, select menus)
          return await this.handleMessageComponent(webhookData);
        case 4: // APPLICATION_COMMAND_AUTOCOMPLETE
          return await this.handleAutocomplete(webhookData);
        case 5: // MODAL_SUBMIT
          return await this.handleModalSubmit(webhookData);
        default:
          logger.warn('Unknown Discord webhook type', { type, eventId: id });
          return { processed: false, reason: 'Unknown webhook type', type };
      }

    } catch (error) {
      logger.error('Error processing Discord webhook', { error: error.message });
      throw error;
    }
  }

  /**
   * Handle Discord ping (verification)
   */
  async handlePing(webhookData) {
    logger.discord('ping_received', {
      eventId: webhookData.id,
      type: webhookData.type
    });

    return {
      processed: true,
      action: 'ping_verified',
      type: 'PONG'
    };
  }

  /**
   * Handle slash command interactions
   */
  async handleSlashCommand(webhookData) {
    const { data, member, user, guild_id, channel_id } = webhookData;
    const commandName = data?.name;

    logger.discord('slash_command', {
      command: commandName,
      userId: member?.user?.id || user?.id,
      guildId: guild_id,
      channelId: channel_id
    });

    switch (commandName) {
      case 'help':
        return await this.handleHelpCommand(webhookData);
      case 'ping':
        return await this.handlePingCommand(webhookData);
      case 'chat':
        return await this.handleChatCommand(webhookData);
      default:
        return {
          processed: true,
          action: 'unknown_command',
          command: commandName
        };
    }
  }

  /**
   * Handle message component interactions (buttons, select menus)
   */
  async handleMessageComponent(webhookData) {
    const { data, member, user, guild_id, channel_id } = webhookData;
    const customId = data?.custom_id;
    const componentType = data?.component_type;

    logger.discord('message_component', {
      customId,
      componentType,
      userId: member?.user?.id || user?.id,
      guildId: guild_id,
      channelId: channel_id
    });

    return {
      processed: true,
      action: 'message_component_processed',
      customId,
      componentType
    };
  }

  /**
   * Handle autocomplete interactions
   */
  async handleAutocomplete(webhookData) {
    const { data, user, guild_id } = webhookData;
    const commandName = data?.name;
    const focusedOption = data?.options?.find(opt => opt.focused);

    logger.discord('autocomplete', {
      command: commandName,
      focusedOption: focusedOption?.name,
      value: focusedOption?.value,
      userId: user?.id,
      guildId: guild_id
    });

    return {
      processed: true,
      action: 'autocomplete_processed',
      command: commandName,
      choices: [] // Return autocomplete choices
    };
  }

  /**
   * Handle modal submit interactions
   */
  async handleModalSubmit(webhookData) {
    const { data, member, user, guild_id, channel_id } = webhookData;
    const customId = data?.custom_id;
    const components = data?.components;

    logger.discord('modal_submit', {
      customId,
      userId: member?.user?.id || user?.id,
      guildId: guild_id,
      channelId: channel_id,
      componentCount: components?.length
    });

    return {
      processed: true,
      action: 'modal_submit_processed',
      customId
    };
  }

  /**
   * Handle /help command
   */
  async handleHelpCommand(webhookData) {
    logger.discord('help_command', {
      userId: webhookData.member?.user?.id || webhookData.user?.id,
      guildId: webhookData.guild_id
    });

    // TODO: Send help message via Discord API
    return {
      processed: true,
      action: 'help_command_processed',
      response: {
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: {
          content: 'Hello! This is the CometChat Discord integration. Use /ping to test the connection.',
          flags: 64 // EPHEMERAL
        }
      }
    };
  }

  /**
   * Handle /ping command
   */
  async handlePingCommand(webhookData) {
    logger.discord('ping_command', {
      userId: webhookData.member?.user?.id || webhookData.user?.id,
      guildId: webhookData.guild_id
    });

    return {
      processed: true,
      action: 'ping_command_processed',
      response: {
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: {
          content: 'Pong! 🏓 CometChat Discord integration is working.',
          flags: 64 // EPHEMERAL
        }
      }
    };
  }

  /**
   * Handle /chat command
   */
  async handleChatCommand(webhookData) {
    const { data } = webhookData;
    const message = data?.options?.find(opt => opt.name === 'message')?.value;

    logger.discord('chat_command', {
      userId: webhookData.member?.user?.id || webhookData.user?.id,
      guildId: webhookData.guild_id,
      messageLength: message?.length
    });

    // TODO: Process chat message with CometChat
    return {
      processed: true,
      action: 'chat_command_processed',
      response: {
        type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
        data: {
          content: `Message received: "${message || 'No message provided'}"\n\nCometChat integration coming soon!`,
          flags: 64 // EPHEMERAL
        }
      }
    };
  }

  /**
   * Send message via Discord API (future implementation)
   */
  async sendMessage(channelId, content, options = {}) {
    logger.discord('send_message_attempt', {
      channelId,
      contentLength: content.length,
      options
    });

    // TODO: Implement Discord Bot API call to send message
    // This would require the Discord Bot API integration

    return {
      sent: false,
      reason: 'API integration not implemented yet'
    };
  }

  /**
   * Create interaction response
   */
  createInteractionResponse(type, data = {}) {
    return {
      type,
      data
    };
  }
}

module.exports = new DiscordService();