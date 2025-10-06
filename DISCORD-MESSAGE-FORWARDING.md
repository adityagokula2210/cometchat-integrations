# Discord Message Forwarding Architecture

## 🎯 **Overview: Discord Gateway Bot for Message Forwarding**

To receive **all Discord messages** (not just slash commands) and forward them to CometChat and Telegram, you need to implement a Discord Gateway bot that connects to Discord's WebSocket API.

---

## 🏗️ **Architecture: Real-time Message Bridge**

```
┌─────────────────────────────────────────────────────────────────┐
│                    DISCORD GATEWAY BOT                          │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  │   Discord WS    │    │  Message Proc.  │    │  Multi-Forward  │
│  │   Gateway       │───▶│   Service       │───▶│   Service       │
│  │  (Real-time)    │    │                 │    │                 │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘
│                              │                         │
└──────────────────────────────┼─────────────────────────┼─────────┘
                               │                         │
                               ▼                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   MESSAGE FORWARDING                            │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  │   CometChat     │    │    Telegram     │    │   Discord       │
│  │   API Client    │    │   Bot API       │    │  Channel Reply  │
│  │                 │    │                 │    │                 │
│  │ • Send Message  │    │ • Send Message  │    │ • Send Message  │
│  │ • Create User   │    │ • Forward Text  │    │ • Reply/React   │
│  │ • Join Group    │    │ • Send Media    │    │ • Edit Message  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔧 **Required Dependencies**

First, let's install the Discord.js library for Gateway connection:

```bash
npm install discord.js @discordjs/rest axios
```

---

## 📁 **Implementation Files**

### 1. **Discord Gateway Service** (`src/services/discordGatewayService.js`)

```javascript
/**
 * Discord Gateway Service
 * Handles real-time Discord message events via WebSocket Gateway
 */

const { Client, GatewayIntentBits, Events } = require('discord.js');
const logger = require('../utils/logger');
const config = require('../config');
const messageForwardingService = require('./messageForwardingService');

class DiscordGatewayService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.botToken = config.discord.botToken;
  }

  /**
   * Initialize Discord Gateway Bot
   */
  async initialize() {
    try {
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,                    // Access to guild info
          GatewayIntentBits.GuildMessages,             // Read guild messages
          GatewayIntentBits.MessageContent,            // Read message content
          GatewayIntentBits.DirectMessages,            // Read DMs
          GatewayIntentBits.GuildMessageReactions,     // Read reactions
          GatewayIntentBits.GuildMembers               // Access member info
        ]
      });

      // Event listeners
      this.setupEventListeners();

      // Login to Discord
      await this.client.login(this.botToken);
      
      logger.discord('gateway_initialized', {
        status: 'connected',
        guilds: this.client.guilds.cache.size
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

    // Message received event
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
   * Handle incoming Discord message
   */
  async handleMessage(message) {
    try {
      // Skip bot messages to prevent loops
      if (message.author.bot) return;

      // Skip empty messages
      if (!message.content && message.attachments.size === 0) return;

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

      logger.discord('message_received', {
        messageId: message.id,
        authorId: message.author.id,
        channelId: message.channelId,
        guildId: message.guildId,
        contentLength: message.content.length,
        hasAttachments: message.attachments.size > 0
      });

      // Forward message to other platforms
      await messageForwardingService.forwardDiscordMessage(messageData);

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

      // You can implement message edit forwarding here
      // await messageForwardingService.forwardMessageUpdate(oldMessage, newMessage);

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

      // You can implement message deletion forwarding here
      // await messageForwardingService.forwardMessageDelete(message);

    } catch (error) {
      logger.error('Error handling Discord message delete', { error: error.message });
    }
  }

  /**
   * Send message to Discord channel
   */
  async sendMessage(channelId, content, options = {}) {
    try {
      const channel = await this.client.channels.fetch(channelId);
      
      if (!channel) {
        throw new Error(\`Channel \${channelId} not found\`);
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
   * Get Discord connection status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      ready: this.client?.readyAt ? true : false,
      guilds: this.client?.guilds.cache.size || 0,
      ping: this.client?.ws.ping || -1
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
```

### 2. **Message Forwarding Service** (`src/services/messageForwardingService.js`)

```javascript
/**
 * Message Forwarding Service
 * Handles cross-platform message forwarding between Discord, CometChat, and Telegram
 */

const logger = require('../utils/logger');
const cometChatApiService = require('./cometChatApiService');
const telegramApiService = require('./telegramApiService');
const discordGatewayService = require('./discordGatewayService');

class MessageForwardingService {
  
  /**
   * Forward Discord message to CometChat and Telegram
   */
  async forwardDiscordMessage(discordMessage) {
    try {
      const results = {
        discord: { source: true },
        cometchat: { forwarded: false },
        telegram: { forwarded: false }
      };

      // Prepare standardized message format
      const standardMessage = this.standardizeMessage(discordMessage, 'discord');

      // Forward to CometChat
      try {
        await cometChatApiService.sendMessage(standardMessage);
        results.cometchat.forwarded = true;
        logger.info('Message forwarded to CometChat', { 
          sourceId: discordMessage.id,
          platform: 'discord->cometchat'
        });
      } catch (error) {
        results.cometchat.error = error.message;
        logger.error('Failed to forward to CometChat', { error: error.message });
      }

      // Forward to Telegram
      try {
        await telegramApiService.sendMessage(standardMessage);
        results.telegram.forwarded = true;
        logger.info('Message forwarded to Telegram', { 
          sourceId: discordMessage.id,
          platform: 'discord->telegram'
        });
      } catch (error) {
        results.telegram.error = error.message;
        logger.error('Failed to forward to Telegram', { error: error.message });
      }

      return results;

    } catch (error) {
      logger.error('Error in Discord message forwarding', { error: error.message });
      throw error;
    }
  }

  /**
   * Forward CometChat message to Discord and Telegram
   */
  async forwardCometChatMessage(cometChatMessage) {
    try {
      const results = {
        cometchat: { source: true },
        discord: { forwarded: false },
        telegram: { forwarded: false }
      };

      const standardMessage = this.standardizeMessage(cometChatMessage, 'cometchat');

      // Forward to Discord
      try {
        await discordGatewayService.sendMessage(
          process.env.DISCORD_BRIDGE_CHANNEL_ID, 
          this.formatMessageForDiscord(standardMessage)
        );
        results.discord.forwarded = true;
      } catch (error) {
        results.discord.error = error.message;
        logger.error('Failed to forward to Discord', { error: error.message });
      }

      // Forward to Telegram
      try {
        await telegramApiService.sendMessage(standardMessage);
        results.telegram.forwarded = true;
      } catch (error) {
        results.telegram.error = error.message;
        logger.error('Failed to forward to Telegram', { error: error.message });
      }

      return results;

    } catch (error) {
      logger.error('Error in CometChat message forwarding', { error: error.message });
      throw error;
    }
  }

  /**
   * Forward Telegram message to Discord and CometChat
   */
  async forwardTelegramMessage(telegramMessage) {
    try {
      const results = {
        telegram: { source: true },
        discord: { forwarded: false },
        cometchat: { forwarded: false }
      };

      const standardMessage = this.standardizeMessage(telegramMessage, 'telegram');

      // Forward to Discord
      try {
        await discordGatewayService.sendMessage(
          process.env.DISCORD_BRIDGE_CHANNEL_ID,
          this.formatMessageForDiscord(standardMessage)
        );
        results.discord.forwarded = true;
      } catch (error) {
        results.discord.error = error.message;
        logger.error('Failed to forward to Discord', { error: error.message });
      }

      // Forward to CometChat
      try {
        await cometChatApiService.sendMessage(standardMessage);
        results.cometchat.forwarded = true;
      } catch (error) {
        results.cometchat.error = error.message;
        logger.error('Failed to forward to CometChat', { error: error.message });
      }

      return results;

    } catch (error) {
      logger.error('Error in Telegram message forwarding', { error: error.message });
      throw error;
    }
  }

  /**
   * Standardize message format across platforms
   */
  standardizeMessage(message, sourcePlatform) {
    const standardized = {
      id: message.id,
      content: message.content || message.text || '',
      author: {
        id: message.author?.id || message.from?.id || message.senderId,
        username: message.author?.username || message.from?.username || message.senderName,
        displayName: message.author?.displayName || message.from?.first_name || message.senderName,
        avatar: message.author?.avatar || null
      },
      timestamp: message.timestamp || message.date || Date.now(),
      platform: sourcePlatform,
      channel: {
        id: message.channel?.id || message.chat?.id || message.conversationId,
        name: message.channel?.name || message.chat?.title || 'Direct'
      },
      attachments: message.attachments || [],
      mentions: message.mentions || [],
      isReply: message.isReply || false,
      replyTo: message.replyTo || null
    };

    return standardized;
  }

  /**
   * Format message for Discord display
   */
  formatMessageForDiscord(standardMessage) {
    const platform = standardMessage.platform.toUpperCase();
    const author = standardMessage.author.displayName || standardMessage.author.username;
    const content = standardMessage.content;
    const channel = standardMessage.channel.name || 'Unknown';

    return \`**[\${platform}]** \${author} in #\${channel}:\\n\${content}\`;
  }

  /**
   * Format message for Telegram display
   */
  formatMessageForTelegram(standardMessage) {
    const platform = standardMessage.platform.toUpperCase();
    const author = standardMessage.author.displayName || standardMessage.author.username;
    const content = standardMessage.content;
    const channel = standardMessage.channel.name || 'Unknown';

    return \`[\${platform}] \${author} in \${channel}:\\n\${content}\`;
  }

  /**
   * Format message for CometChat display
   */
  formatMessageForCometChat(standardMessage) {
    const platform = standardMessage.platform.toUpperCase();
    const author = standardMessage.author.displayName || standardMessage.author.username;
    const content = standardMessage.content;

    return \`[\${platform}] \${author}: \${content}\`;
  }
}

module.exports = new MessageForwardingService();
```

### 3. **CometChat API Service** (`src/services/cometChatApiService.js`)

```javascript
/**
 * CometChat API Service
 * Handles CometChat REST API operations for sending messages
 */

const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

class CometChatApiService {
  constructor() {
    this.apiKey = config.cometchat.apiKey;
    this.appId = config.cometchat.appId;
    this.region = config.cometchat.region;
    this.baseUrl = \`https://\${this.appId}-\${this.region}.api-\${this.region}.cometchat.io/v3\`;
  }

  /**
   * Send message to CometChat
   */
  async sendMessage(standardMessage) {
    try {
      const endpoint = \`\${this.baseUrl}/messages\`;
      
      const payload = {
        category: 'message',
        type: 'text',
        data: {
          text: this.formatMessage(standardMessage)
        },
        receiver: process.env.COMETCHAT_BRIDGE_USER_ID || 'bridge-group',
        receiverType: process.env.COMETCHAT_BRIDGE_USER_ID ? 'user' : 'group'
      };

      const response = await axios.post(endpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'appId': this.appId,
          'apiKey': this.apiKey
        }
      });

      logger.cometchat('message_sent', {
        messageId: response.data.data.id,
        originalPlatform: standardMessage.platform,
        originalId: standardMessage.id
      });

      return response.data;

    } catch (error) {
      logger.error('CometChat API error', { error: error.message });
      throw error;
    }
  }

  /**
   * Format message for CometChat
   */
  formatMessage(standardMessage) {
    const platform = standardMessage.platform.toUpperCase();
    const author = standardMessage.author.displayName || standardMessage.author.username;
    const content = standardMessage.content;
    const timestamp = new Date(standardMessage.timestamp).toLocaleTimeString();

    return \`[\${platform}] \${author} (\${timestamp}): \${content}\`;
  }
}

module.exports = new CometChatApiService();
```

### 4. **Telegram API Service** (`src/services/telegramApiService.js`)

```javascript
/**
 * Telegram API Service
 * Handles Telegram Bot API operations for sending messages
 */

const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

class TelegramApiService {
  constructor() {
    this.botToken = config.telegram.botToken;
    this.baseUrl = \`https://api.telegram.org/bot\${this.botToken}\`;
  }

  /**
   * Send message to Telegram
   */
  async sendMessage(standardMessage) {
    try {
      const endpoint = \`\${this.baseUrl}/sendMessage\`;
      
      const payload = {
        chat_id: process.env.TELEGRAM_BRIDGE_CHAT_ID || '@your_channel',
        text: this.formatMessage(standardMessage),
        parse_mode: 'HTML'
      };

      const response = await axios.post(endpoint, payload);

      logger.telegram('message_sent', {
        messageId: response.data.result.message_id,
        originalPlatform: standardMessage.platform,
        originalId: standardMessage.id
      });

      return response.data;

    } catch (error) {
      logger.error('Telegram API error', { error: error.message });
      throw error;
    }
  }

  /**
   * Format message for Telegram
   */
  formatMessage(standardMessage) {
    const platform = standardMessage.platform.toUpperCase();
    const author = standardMessage.author.displayName || standardMessage.author.username;
    const content = standardMessage.content;
    const timestamp = new Date(standardMessage.timestamp).toLocaleTimeString();

    return \`<b>[\${platform}]</b> \${author} <i>(\${timestamp})</i>:\\n\${content}\`;
  }
}

module.exports = new TelegramApiService();
```

---

## ⚙️ **Environment Configuration**

Add these to your `.env` file:

```properties
# Bridge Configuration
DISCORD_BRIDGE_CHANNEL_ID=your_discord_channel_id
TELEGRAM_BRIDGE_CHAT_ID=your_telegram_chat_id  
COMETCHAT_BRIDGE_USER_ID=your_cometchat_user_or_group_id

# Discord Gateway Bot
DISCORD_BOT_TOKEN=your_actual_bot_token
DISCORD_APPLICATION_ID=your_application_id
```

---

## 🚀 **Integration into Main App**

Update `app.js` to initialize the Gateway bot:

```javascript
// Add to app.js
const discordGatewayService = require('./src/services/discordGatewayService');

// Initialize Discord Gateway after server starts
const startServer = async () => {
  const PORT = config.server.port;
  
  app.listen(PORT, async () => {
    logger.info('🚀 Server started successfully', { port: PORT });
    
    // Initialize Discord Gateway Bot
    try {
      await discordGatewayService.initialize();
      logger.info('✅ Discord Gateway Bot initialized');
    } catch (error) {
      logger.error('❌ Discord Gateway Bot failed to initialize', { error: error.message });
    }
  });
};
```

---

## 🎯 **How It Works**

1. **Discord Gateway Bot** connects to Discord WebSocket and listens to all messages
2. **Message Standardization** converts platform-specific formats to universal format  
3. **Cross-Platform Forwarding** sends messages to CometChat and Telegram APIs
4. **Bidirectional Flow** works for messages from any platform to any other platform
5. **Rich Formatting** preserves author, timestamp, and channel information

---

## 📋 **Setup Checklist**

- ✅ Install Discord.js: `npm install discord.js @discordjs/rest axios`
- ✅ Get Discord Bot Token with Message Content Intent enabled
- ✅ Set up bridge channels/groups in each platform
- ✅ Configure environment variables
- ✅ Deploy and test message forwarding

This creates a **real-time message bridge** between Discord, CometChat, and Telegram! 🚀