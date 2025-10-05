# Discord Integration Architecture

## Overview

The Discord integration follows the same clean architecture pattern as CometChat and Telegram integrations, providing a comprehensive webhook handling system for Discord bot interactions.

## Architecture Components

```
Discord Integration Architecture
┌─────────────────────────────────────────────────────────────────┐
│                    Discord Bot Application                       │
│                  (Discord Developer Portal)                     │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Webhook Events
                      │ (Slash Commands, Interactions)
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express Server                               │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Webhook Logger │  │  Webhook Auth   │  │  Error Handler  │  │
│  │   Middleware    │  │   Middleware    │  │   Middleware    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                              │                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Discord Routes                              │    │
│  │  GET  /discord  - Service Info                         │    │
│  │  POST /discord  - Webhook Handler                      │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            Discord Controller                           │    │
│  │  - getInfo()                                           │    │
│  │  - handleWebhook()                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │            Discord Service                              │    │
│  │  - processWebhook()                                    │    │
│  │  - handlePing()                                        │    │
│  │  - handleSlashCommand()                                │    │
│  │  - handleMessageComponent()                            │    │
│  │  - handleAutocomplete()                                │    │
│  │  - handleModalSubmit()                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                              │                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │    Logger       │  │   Validator     │  │   Response      │  │
│  │   Utility       │  │   Utility       │  │   Handler       │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Future Integrations                            │
│  - Discord Bot API (Send Messages)                             │
│  - CometChat Discord Bridge                                    │
│  - User/Group Mapping                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Discord Webhook Types

### 1. PING (Type 1)
```javascript
// Discord sends this to verify webhook endpoint
{
  "type": 1,
  "id": "interaction-id",
  "token": "interaction-token"
}

// Server responds with PONG
{
  "processed": true,
  "action": "ping_verified",
  "type": "PONG"
}
```

### 2. APPLICATION_COMMAND (Type 2)
```javascript
// Slash command interaction
{
  "type": 2,
  "id": "interaction-id",
  "token": "interaction-token",
  "data": {
    "name": "help",
    "options": []
  },
  "user": { "id": "user-id" },
  "guild_id": "guild-id",
  "channel_id": "channel-id"
}

// Server response with interaction response
{
  "type": 4, // CHANNEL_MESSAGE_WITH_SOURCE
  "data": {
    "content": "Help message content",
    "flags": 64 // EPHEMERAL
  }
}
```

### 3. MESSAGE_COMPONENT (Type 3)
```javascript
// Button click or select menu interaction
{
  "type": 3,
  "data": {
    "custom_id": "button-id",
    "component_type": 2
  }
}
```

### 4. APPLICATION_COMMAND_AUTOCOMPLETE (Type 4)
```javascript
// Autocomplete interaction
{
  "type": 4,
  "data": {
    "name": "command",
    "options": [
      {
        "name": "option",
        "value": "partial-input",
        "focused": true
      }
    ]
  }
}
```

### 5. MODAL_SUBMIT (Type 5)
```javascript
// Modal form submission
{
  "type": 5,
  "data": {
    "custom_id": "modal-id",
    "components": []
  }
}
```

## Data Flow Examples

### Discord Slash Command Flow
```
1. User types /help in Discord
   ↓
2. Discord sends webhook to /discord endpoint
   POST /discord
   {
     "type": 2,
     "data": { "name": "help" },
     "user": { "id": "123" }
   }
   ↓
3. Webhook Logger logs beautified JSON
   ↓
4. Webhook Auth validates payload structure
   ↓
5. Discord Controller receives request
   ↓
6. Discord Service processes slash command
   - Identifies command type
   - Calls handleHelpCommand()
   - Logs command execution
   ↓
7. Service returns interaction response
   {
     "type": 4,
     "data": {
       "content": "Help message",
       "flags": 64
     }
   }
   ↓
8. Controller sends success response
   ↓
9. Discord displays ephemeral message to user
```

### Discord Button Interaction Flow
```
1. User clicks button in Discord
   ↓
2. Discord sends component interaction
   POST /discord
   {
     "type": 3,
     "data": {
       "custom_id": "action-button",
       "component_type": 2
     }
   }
   ↓
3-6. Same middleware and routing as above
   ↓
7. Service processes message component
   - Identifies button by custom_id
   - Executes appropriate action
   - Logs interaction
   ↓
8. Service returns appropriate response
   ↓
9. Discord updates message or shows response
```

## Supported Commands

### Built-in Commands
- `/help` - Shows help information (ephemeral)
- `/ping` - Tests bot connectivity (ephemeral)  
- `/chat <message>` - Chat integration placeholder (ephemeral)

### Command Responses
All command responses are ephemeral (only visible to the user who triggered them) using the `flags: 64` option.

## Configuration

### Environment Variables
```bash
# Discord Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_APPLICATION_ID=your_discord_application_id_here
DISCORD_PUBLIC_KEY=your_discord_public_key_here
DISCORD_WEBHOOK_SECRET=your_discord_webhook_secret_here
```

### Discord Application Setup
1. Create application at https://discord.com/developers/applications
2. Create bot user
3. Configure slash commands
4. Set webhook endpoint URL
5. Install bot to server with appropriate permissions

## Security Features

### Signature Verification
```javascript
// Checks for Discord signature headers
const signature = headers['x-signature-ed25519'];
const timestamp = headers['x-signature-timestamp'];

// TODO: Implement Ed25519 signature verification
// using Discord's public key
```

### Payload Validation
```javascript
// Validates required Discord fields
- type: Required for all interactions
- id: Required for non-ping interactions  
- token: Required for non-ping interactions
- data: Required for command interactions
```

## Logging System

### Unified Webhook Logging
The Discord integration uses the same unified webhook logger as Telegram and CometChat:

```javascript
// Single log entry with beautified JSON
{
  "service": "discord",
  "event": "payload_received", 
  "prettyJSON": "{\n  \"type\": 2,\n  \"data\": {\n    \"name\": \"help\"\n  }\n}"
}
```

### Service-specific Logging
```javascript
logger.discord('slash_command', {
  command: 'help',
  userId: '123456789',
  guildId: '987654321',
  channelId: '111222333'
});
```

## API Endpoints

### GET /discord
Returns Discord service information and status.

**Response:**
```json
{
  "success": true,
  "message": "Discord service information",
  "data": {
    "service": "CometChat Discord Integration",
    "status": "active", 
    "version": "1.0.0",
    "endpoints": {
      "webhook": "POST /discord",
      "info": "GET /discord"
    }
  }
}
```

### POST /discord
Handles Discord webhook interactions.

**Request:** Discord interaction payload
**Response:** Webhook processing result with interaction response

## Future Enhancements

### 1. Discord Bot API Integration
- Send messages to Discord channels
- Create/update/delete messages
- Manage server members and roles

### 2. CometChat Bridge
- Forward Discord messages to CometChat
- Sync user presence and status
- Cross-platform chat rooms

### 3. Advanced Interactions
- Rich embeds and components
- Slash command options and autocomplete
- Modal forms for complex input

### 4. Database Integration
- Store Discord server configurations
- Map Discord users to CometChat users
- Persistent chat history and settings

## Testing

### Manual Testing
```bash
# Test service info
curl http://localhost:3000/discord

# Test PING webhook
curl -X POST http://localhost:3000/discord \
  -H "Content-Type: application/json" \
  -d '{"type": 1, "id": "test", "token": "test"}'

# Test slash command
curl -X POST http://localhost:3000/discord \
  -H "Content-Type: application/json" \
  -d '{
    "type": 2,
    "data": {"name": "help"},
    "user": {"id": "123"},
    "guild_id": "456"
  }'
```

### Integration Testing
Use Discord's Developer Portal webhook testing or set up a development Discord server with the bot installed.

## Error Handling

The Discord integration includes comprehensive error handling:
- Malformed webhook payloads
- Unknown interaction types
- Missing required fields
- Authentication failures
- Service processing errors

All errors are logged with appropriate detail levels and return standardized error responses to Discord.