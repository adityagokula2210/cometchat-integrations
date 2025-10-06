# Discord ID Collection Guide

## Once your Discord bot is working, follow these steps:

### 1. Send a test message in your Discord channel
### 2. Look for this output in your server logs:

```
🔥 DISCORD MESSAGE RECEIVED 🔥
📍 CHANNEL ID: [YOUR_CHANNEL_ID]
🏰 GUILD ID: [YOUR_GUILD_ID]
```

### 3. Copy those IDs and update the bridge configuration:

In `src/services/bridgeConfigService.js`, replace:
```javascript
channelId: 'DISCORD_CHANNEL_ID_PLACEHOLDER',
guildId: 'DISCORD_GUILD_ID_PLACEHOLDER'
```

With your actual IDs:
```javascript
channelId: 'YOUR_ACTUAL_CHANNEL_ID',
guildId: 'YOUR_ACTUAL_GUILD_ID'
```

### 4. Current Bridge Configuration Status:
- ✅ CometChat Group ID: `cometchat-guid-1`
- ✅ Telegram Group ID: `-4969601855`
- ⏳ Discord Channel ID: Waiting for logs
- ⏳ Discord Guild ID: Waiting for logs

### 5. After updating the Discord IDs, restart your server to activate the bridge!