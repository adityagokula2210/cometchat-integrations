# CometChat Integrations

A production-ready Node.js Express server for handling CometChat and Telegram integrations with webhook processing, comprehensive logging, and auto-deployment capabilities.

## � Live Deployment

**Production URL**: https://adityagokula.com/cometchat-integrations/

## �🏗️ Clean Architecture

This project follows a modular architecture with clear separation of concerns:

```
cometchat-integrations/
├── app.js                      # Main application entry point
├── package.json                # Project dependencies
├── ecosystem.config.js         # PM2 configuration
├── .github/workflows/          # GitHub Actions CI/CD
├── .env.example               # Environment template
└── src/
    ├── config/                 # Configuration management
    │   └── index.js           # Environment variables & settings
    ├── controllers/            # Request handlers
    │   ├── healthController.js # Health checks & status
    │   ├── rootController.js   # API information
    │   ├── cometChatController.js # CometChat webhook handling
    │   └── telegramController.js  # Telegram webhook handling
    ├── services/               # Business logic
    │   ├── cometChatService.js # CometChat integration logic
    │   └── telegramService.js  # Telegram bot logic
    ├── middleware/             # Express middleware
    │   ├── requestLogger.js    # Request/response logging
    │   ├── bodyLogger.js       # JSON payload logging
    │   ├── errorHandler.js     # Global error handling
    │   └── webhookAuth.js      # Webhook authentication
    ├── routes/                 # Route definitions
    │   ├── rootRoutes.js       # Root API routes
    │   ├── healthRoutes.js     # Health check routes
    │   ├── cometChatRoutes.js  # CometChat webhook routes
    │   └── telegramRoutes.js   # Telegram webhook routes
    └── utils/                  # Utility functions
        ├── logger.js           # Main logging utility
        ├── productionLogger.js # Production output
        ├── response.js         # Standardized responses
        └── validator.js        # Input validation
```

## 🚀 Features

- **Clean Architecture**: Modular design with separation of concerns
- **Production Logging**: PM2-compatible logging with JSON payloads
- **Webhook Processing**: Handles CometChat and Telegram webhooks
- **Auto-deployment**: GitHub Actions CI/CD pipeline
- **HTTPS/SSL**: Let's Encrypt certificates with auto-renewal
- **Error Handling**: Centralized error handling and recovery
- **Input Validation**: Request validation and sanitization
- **Health Monitoring**: Health checks and system status endpoints
- **Production Ready**: PM2 process management and nginx reverse proxy

## 📋 API Endpoints

### Core Endpoints
- `GET /` - API information and documentation
- `GET /health` - Health check with uptime and version info
- `GET /status` - Detailed system status

### CometChat Integration
- `GET /cometchat` - CometChat service information
- `POST /cometchat` - CometChat webhook endpoint

### Telegram Integration  
- `GET /telegram` - Telegram service information
- `POST /telegram` - Telegram webhook endpoint

## 🔧 Configuration

Environment variables can be set for configuration:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# CometChat Configuration
COMETCHAT_APP_ID=your_app_id
COMETCHAT_REGION=us
COMETCHAT_API_KEY=your_api_key
COMETCHAT_WEBHOOK_SECRET=your_webhook_secret

# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret

# Logging Configuration
LOG_LEVEL=info
ENABLE_FILE_LOGGING=false

# Security Configuration
ENABLE_AUTH=false
JWT_SECRET=your_jwt_secret
CORS_ORIGINS=*
```

## 🛠️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/adityagokula2210/cometchat-integrations.git
   cd cometchat-integrations
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the template and configure your values
   cp .env.example .env
   
   # Edit .env with your actual credentials:
   # - Get CometChat credentials from: https://app.cometchat.com/
   # - Get Telegram bot token from: @BotFather on Telegram
   nano .env
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Start production server**
   ```bash
   npm start
   ```

## 🌐 Deployment

### Auto-Deployment via GitHub Actions

The project includes a GitHub Actions workflow that automatically deploys to your server when code is pushed to the main branch.

**Deployment Flow:**
1. Push code to `main` branch
2. GitHub Actions triggers
3. Code is pulled on the server
4. Dependencies are installed
5. PM2 restarts the application
6. Server is live with new changes

### Production Server Setup

**Server Requirements:**
- Node.js 14+
- PM2 process manager
- nginx reverse proxy
- Git for auto-deployment

**PM2 Configuration:**
```bash
# Start application with PM2
pm2 start ecosystem.config.js --env production

# Monitor application
pm2 status
pm2 logs cometchat-integrations
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name adityagokula.com;

    location /cometchat-integrations/ {
        proxy_pass http://localhost:3001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring & Logging

### Structured Logging
All requests and responses are logged with structured JSON format:

```json
{
  "timestamp": "2025-10-04T07:00:00.000Z",
  "level": "INFO",
  "message": "CometChat webhook received",
  "service": "cometchat",
  "action": "message_sent",
  "messageId": "123",
  "sender": "user123"
}
```

### Health Monitoring
- Health checks at `/health`
- System status at `/status`
- Process monitoring with PM2
- Auto-restart on failures

## 🔐 Security

- Input validation and sanitization
- Webhook signature verification (configurable)
- Rate limiting (can be added)
- CORS protection
- Proxy trust configuration
- Error message sanitization in production

## 🧪 Testing

Test the webhooks locally:

```bash
# Test CometChat webhook
curl -X POST "http://localhost:3000/cometchat" \
  -H "Content-Type: application/json" \
  -d '{
    "trigger": "message_sent",
    "data": {
      "message": {
        "id": "123",
        "text": "Hello World"
      }
    },
    "appId": "your_app_id"
  }'

# Test Telegram webhook
curl -X POST "http://localhost:3000/telegram" \
  -H "Content-Type: application/json" \
  -d '{
    "update_id": 123,
    "message": {
      "message_id": 456,
      "text": "/start",
      "from": {"id": 789, "username": "testuser"}
    }
  }'
```

## 📚 Development

### Adding New Integrations

1. **Create Service**: Add business logic in `src/services/`
2. **Create Controller**: Add request handling in `src/controllers/`
3. **Create Routes**: Add route definitions in `src/routes/`
4. **Update Main App**: Register routes in `app.js`
5. **Add Configuration**: Update config in `src/config/`

### Code Style
- Use structured logging via the logger utility
- Follow the controller → service → response pattern
- Implement proper error handling
- Add input validation for all endpoints
- Use the ResponseHandler for consistent API responses

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🔗 Links

- **Production URL**: https://adityagokula.com/cometchat-integrations/
- **GitHub Repository**: https://github.com/adityagokula2210/cometchat-integrations
- **CometChat Docs**: https://www.cometchat.com/docs/
- **Telegram Bot API**: https://core.telegram.org/bots/api