# CometChat Integrations - Architecture Documentation

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [Message Flow](#message-flow)
- [API Endpoints](#api-endpoints)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)

## 🎯 Project Overview

**CometChat Integrations** is a Node.js Express server that enables bidirectional messaging between CometChat and other platforms (Discord, Telegram). It acts as a webhook handler and message router, allowing seamless cross-platform communication.

### Key Features
- ✅ **CometChat Webhook Integration** - Handles `after_message` triggers
- ✅ **Discord Bot Integration** - Real-time Gateway connection
- ✅ **Telegram Bot Integration** - Webhook-based messaging
- ✅ **Bidirectional Message Routing** - Messages flow between all platforms
- ✅ **Comprehensive Logging** - Debug and monitoring capabilities
- ✅ **Health Monitoring** - Service status endpoints
- ✅ **Production Ready** - SSL, security headers, error handling

## 🏗️ System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CometChat     │    │    Discord      │    │   Telegram      │
│   Platform      │    │   Platform      │    │   Platform      │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ Webhooks             │ Gateway              │ Webhooks
          │                      │ Connection           │
          ▼                      ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                CometChat Integrations Server                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Webhook    │  │  Message    │  │    API Services         │  │
│  │  Handlers   │  │  Router     │  │  • CometChat API        │  │
│  │             │  │             │  │  • Discord API          │  │
│  │             │  │             │  │  • Telegram API         │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
          │                      │                      │
          ▼                      ▼                      ▼
    ┌───────────┐          ┌───────────┐          ┌───────────┐
    │   Logs    │          │  Health   │          │   Error   │
    │ & Debug   │          │Monitoring │          │ Handling  │
    └───────────┘          └───────────┘          └───────────┘
```

## 📁 Project Structure

```
cometchat-integrations/
├── app.js                      # Main application entry point
├── package.json               # Dependencies and scripts
├── ecosystem.config.js        # PM2 configuration
├── nginx-ssl.conf            # Nginx SSL configuration
├── ssl-commands.txt          # SSL setup commands
├── README.md                 # Project documentation
├── ARCHITECTURE.md           # This file
└── src/
    ├── config/
    │   └── index.js          # Environment configuration
    ├── controllers/
    │   ├── cometChatController.js    # CometChat webhook handler
    │   ├── healthController.js       # Health check endpoints
    │   ├── rootController.js         # Root API endpoints
    │   └── telegramController.js     # Telegram webhook handler
    ├── middleware/
    │   ├── bodyLogger.js             # Request body logging
    │   ├── errorHandler.js           # Global error handling
    │   ├── requestLogger.js          # Request logging
    │   ├── webhookAuth.js            # Webhook authentication
    │   └── webhookLogger.js          # Webhook-specific logging
    ├── routes/
    │   ├── cometChatRoutes.js        # CometChat API routes
    │   ├── healthRoutes.js           # Health check routes
    │   ├── rootRoutes.js             # Root API routes
    │   └── telegramRoutes.js         # Telegram API routes
    ├── services/
    │   ├── bridgeConfigService.js    # Bridge configuration
    │   ├── cometChatApiService.js    # CometChat API client
    │   ├── cometChatService.js       # CometChat business logic
    │   ├── discordApiService.js      # Discord API client
    │   ├── discordGatewayService.js  # Discord Gateway connection
    │   ├── discordService.js         # Discord business logic
    │   ├── messageRouterService.js   # Cross-platform routing
    │   ├── telegramApiService.js     # Telegram API client
    │   └── telegramService.js        # Telegram business logic
    └── utils/
        ├── logger.js                 # Logging utility
        ├── productionLogger.js       # Production logging
        ├── response.js               # Response formatting
        └── validator.js              # Input validation
```

## 🔧 Core Components

### 1. **Webhook Handlers** (`controllers/`)
- **CometChat Controller**: Processes `after_message` triggers from CometChat
- **Telegram Controller**: Handles Telegram bot webhooks
- **Health Controller**: Service status and monitoring endpoints

### 2. **Message Router** (`services/messageRouterService.js`)
- **Central Hub**: Routes messages between all platforms
- **Format Conversion**: Standardizes message formats across platforms
- **Bridge Logic**: Determines where messages should be forwarded

### 3. **API Services** (`services/*ApiService.js`)
- **CometChat API**: REST API integration for sending messages
- **Discord API**: HTTP API for Discord interactions
- **Telegram API**: Bot API for sending messages

### 4. **Gateway Services**
- **Discord Gateway**: Real-time WebSocket connection for Discord events
- **Webhook Processing**: HTTP-based webhook handling for other platforms

### 5. **Middleware**
- **Authentication**: Webhook signature verification
- **Logging**: Request/response logging and debugging
- **Error Handling**: Global error processing and response formatting

## 🔄 Message Flow

### CometChat → Other Platforms

```
1. CometChat sends webhook → /cometchat endpoint
2. webhookAuth middleware validates request
3. cometChatController processes webhook payload
4. Extracts sender info from data.entities.sender.entity
5. messageRouterService converts to standard format
6. Routes to Discord & Telegram via respective API services
```

### Discord → Other Platforms

```
1. Discord Gateway receives message event
2. discordGatewayService processes event
3. messageRouterService converts to standard format
4. Routes to CometChat & Telegram via respective API services
```

### Telegram → Other Platforms

```
1. Telegram sends webhook → /telegram endpoint
2. telegramController processes webhook payload
3. messageRouterService converts to standard format
4. Routes to CometChat & Discord via respective API services
```

## 🌐 API Endpoints

### Core Endpoints
```
GET  /                    # API information
GET  /health             # Service health status
GET  /status             # Detailed service status
```

### Webhook Endpoints
```
POST /cometchat          # CometChat webhook handler
GET  /cometchat          # CometChat service info
POST /telegram           # Telegram webhook handler
GET  /telegram           # Telegram service info
```

### Health Monitoring
```json
GET /health
{
  "status": "healthy",
  "timestamp": "2025-10-07T16:00:00.000Z",
  "services": {
    "discord": { "status": "connected", "guilds": 1 },
    "telegram": { "status": "active" },
    "cometchat": { "status": "active" }
  }
}
```

## ⚙️ Configuration

### Environment Variables
```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# CometChat Configuration
COMETCHAT_APP_ID=your-app-id
COMETCHAT_REGION=in
COMETCHAT_API_KEY=your-api-key
COMETCHAT_WEBHOOK_SECRET=your-webhook-secret

# Discord Configuration
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_APPLICATION_ID=your-app-id
DISCORD_PUBLIC_KEY=your-public-key
DISCORD_WEBHOOK_SECRET=your-webhook-secret

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_WEBHOOK_SECRET=your-webhook-secret

# Security & Logging
ENABLE_AUTH=true
LOG_LEVEL=info
ENABLE_FILE_LOGGING=false
```

### Configuration Structure (`src/config/index.js`)
```javascript
{
  server: { port, env, trustProxy },
  cometchat: { appId, region, apiKey, webhookSecret },
  telegram: { botToken, webhookSecret },
  discord: { botToken, applicationId, publicKey, webhookSecret },
  logging: { level, enableConsole, enableFile },
  security: { enableAuth, jwtSecret, corsOrigins }
}
```

## 🚀 Deployment

### Development
```bash
npm install
npm start
# Server runs on http://localhost:3000
```

### Production (PM2)
```bash
npm install --production
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Nginx Configuration
- SSL termination with Let's Encrypt
- Reverse proxy to Node.js server
- Security headers and HSTS
- Rate limiting and request size limits

### Webhook URLs
```
Production: https://adityagokula.com/cometchat-integrations/cometchat
Development: http://localhost:3000/cometchat
```

## 🛠️ Development Guide

### Adding New Platform Integration

1. **Create API Service** (`src/services/newPlatformApiService.js`)
```javascript
class NewPlatformApiService {
  async sendMessage(message) {
    // Platform-specific message sending logic
  }
}
```

2. **Create Business Logic Service** (`src/services/newPlatformService.js`)
```javascript
class NewPlatformService {
  async processWebhook(payload) {
    // Webhook processing logic
  }
}
```

3. **Create Controller** (`src/controllers/newPlatformController.js`)
```javascript
class NewPlatformController {
  static async handleWebhook(req, res) {
    // HTTP endpoint handler
  }
}
```

4. **Create Routes** (`src/routes/newPlatformRoutes.js`)
```javascript
router.post('/newplatform', webhookAuth('newplatform'), NewPlatformController.handleWebhook);
```

5. **Update Message Router** (`src/services/messageRouterService.js`)
```javascript
// Add new platform to routing logic
await this.newPlatformApiService.sendMessage(standardMessage);
```

### Message Format Standard
```javascript
{
  id: 'platform_messageId',
  source: 'platform_name',
  author: {
    id: 'user_id',
    name: 'User Name',
    displayName: 'Display Name',
    isBot: false,
    avatar: 'avatar_url'
  },
  content: {
    text: 'message_text',
    attachments: [],
    metadata: {}
  },
  channel: {
    id: 'channel_id',
    name: 'Channel Name',
    type: 'channel_type'
  },
  timestamp: Date,
  platform: {
    messageUrl: 'platform_message_url'
  }
}
```

### Debugging

#### Enable Debug Logging
```bash
LOG_LEVEL=debug npm start
```

#### Common Debug Points
- Webhook payload structure
- Message format conversion
- API service responses
- Authentication issues

## 🔍 Troubleshooting

### Common Issues

#### 1. **Webhooks Not Received**
```bash
# Check if server is accessible
curl https://adityagokula.com/cometchat-integrations/cometchat

# Check logs for webhook entries
tail -f logs/app.log | grep "CometChat webhook"
```

#### 2. **SSL Handshake Failures**
- Update nginx SSL configuration with broader cipher support
- Verify Let's Encrypt certificate validity
- Check TLS version compatibility

#### 3. **Message Not Routing**
- Verify bridge configuration in `bridgeConfigService.js`
- Check API service authentication
- Validate message format conversion

#### 4. **Discord Gateway Issues**
```javascript
// Check Discord bot permissions
// Verify bot token validity
// Ensure proper gateway intents
```

#### 5. **"Unknown User" in Messages**
- CometChat sender info is in `data.entities.sender.entity`
- Telegram sender info is in `message.from`
- Discord sender info is in `message.author`

### Log Analysis
```bash
# Filter CometChat webhook logs
grep "CometChat webhook" logs/app.log

# Monitor message routing
grep "Message routed" logs/app.log

# Check error logs
grep "ERROR" logs/app.log | tail -20
```

### Health Monitoring
```bash
# Check service status
curl http://localhost:3000/health | jq

# Monitor specific service
curl http://localhost:3000/health | jq '.services.discord'
```

## 📚 Additional Resources

- **CometChat Webhook Documentation**: [CometChat Webhooks](https://www.cometchat.com/docs/webhooks)
- **Discord Bot Documentation**: [Discord.js Guide](https://discordjs.guide/)
- **Telegram Bot API**: [Telegram Bot API](https://core.telegram.org/bots/api)
- **Express.js Documentation**: [Express.js](https://expressjs.com/)
- **PM2 Process Manager**: [PM2 Documentation](https://pm2.keymetrics.io/)

---

**Last Updated**: October 7, 2025  
**Version**: 2.0.2  
**Maintainer**: Development Team