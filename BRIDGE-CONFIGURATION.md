# Bridge Configuration Management
## Cross-Platform Group/Channel ID Mapping

### 🎯 **Challenge**
Each platform uses different ID formats and structures:
- **Discord:** Channel IDs (e.g., `1234567890123456789`)
- **Telegram:** Chat IDs (e.g., `-1001234567890` for groups)
- **CometChat:** Group IDs (e.g., `group_123`) or User IDs (e.g., `user_456`)

### 🏗️ **Solution Architecture**

## **Option 1: Environment Variables (Simple)**
### For Single Bridge Setup

```bash
# .env configuration
# Bridge 1: Main chat rooms
BRIDGE_1_DISCORD_CHANNEL=1234567890123456789
BRIDGE_1_TELEGRAM_CHAT=-1001234567890
BRIDGE_1_COMETCHAT_GROUP=main_group_123

# Bridge 2: Support channels  
BRIDGE_2_DISCORD_CHANNEL=9876543210987654321
BRIDGE_2_TELEGRAM_CHAT=-1009876543210
BRIDGE_2_COMETCHAT_GROUP=support_group_456

# Bridge 3: Announcements
BRIDGE_3_DISCORD_CHANNEL=5555666677778888999
BRIDGE_3_TELEGRAM_CHAT=-1005555666677
BRIDGE_3_COMETCHAT_GROUP=announcements_789
```

---

## **Option 2: JSON Configuration File (Flexible)**
### For Multiple Bridge Management

```javascript
// src/config/bridges.json
{
  "bridges": [
    {
      "id": "main_chat",
      "name": "Main Community Chat",
      "description": "Primary discussion channel",
      "enabled": true,
      "platforms": {
        "discord": {
          "channelId": "1234567890123456789",
          "channelName": "general",
          "guildId": "987654321098765432"
        },
        "telegram": {
          "chatId": "-1001234567890",
          "chatTitle": "Main Community",
          "chatType": "supergroup"
        },
        "cometchat": {
          "groupId": "main_group_123",
          "groupName": "Community",
          "groupType": "public"
        }
      },
      "settings": {
        "syncMessages": true,
        "syncFiles": true,
        "syncReactions": false,
        "maxMessageLength": 2000,
        "allowedFileTypes": ["image", "document"]
      }
    },
    {
      "id": "support_channel",
      "name": "Support Channel",
      "description": "Customer support discussions",
      "enabled": true,
      "platforms": {
        "discord": {
          "channelId": "9876543210987654321",
          "channelName": "support",
          "guildId": "987654321098765432"
        },
        "telegram": {
          "chatId": "-1009876543210",
          "chatTitle": "Support Chat",
          "chatType": "group"
        },
        "cometchat": {
          "groupId": "support_group_456",
          "groupName": "Support",
          "groupType": "private"
        }
      },
      "settings": {
        "syncMessages": true,
        "syncFiles": true,
        "syncReactions": true,
        "maxMessageLength": 1000,
        "allowedFileTypes": ["image"]
      }
    }
  ],
  "defaultSettings": {
    "syncMessages": true,
    "syncFiles": false,
    "syncReactions": false,
    "maxMessageLength": 2000,
    "allowedFileTypes": ["image", "document", "video"]
  }
}
```

---

## **Option 3: Database Storage (Scalable)**
### For Enterprise/Dynamic Management

```javascript
// src/models/BridgeConfiguration.js
class BridgeConfiguration {
  constructor() {
    this.bridges = new Map();
  }

  // Bridge schema
  static schema = {
    id: 'string',
    name: 'string', 
    description: 'string',
    enabled: 'boolean',
    platforms: {
      discord: { channelId: 'string', guildId: 'string' },
      telegram: { chatId: 'string', chatType: 'string' },
      cometchat: { groupId: 'string', groupType: 'string' }
    },
    settings: {
      syncMessages: 'boolean',
      syncFiles: 'boolean', 
      syncReactions: 'boolean',
      filters: 'object'
    },
    createdAt: 'date',
    updatedAt: 'date'
  }
}
```

---

## **Recommended Implementation: Hybrid Approach**

### **Phase 1: Environment Variables (MVP)**
Start simple for immediate functionality:

```javascript
// src/services/bridgeConfigService.js
class BridgeConfigService {
  constructor() {
    this.bridges = this.loadBridgesFromEnv();
  }

  loadBridgesFromEnv() {
    const bridges = [];
    let bridgeIndex = 1;
    
    while (process.env[`BRIDGE_${bridgeIndex}_DISCORD_CHANNEL`]) {
      bridges.push({
        id: `bridge_${bridgeIndex}`,
        discord: {
          channelId: process.env[`BRIDGE_${bridgeIndex}_DISCORD_CHANNEL`]
        },
        telegram: {
          chatId: process.env[`BRIDGE_${bridgeIndex}_TELEGRAM_CHAT`]
        },
        cometchat: {
          groupId: process.env[`BRIDGE_${bridgeIndex}_COMETCHAT_GROUP`]
        }
      });
      bridgeIndex++;
    }
    
    return bridges;
  }

  getBridgeByPlatformId(platform, id) {
    return this.bridges.find(bridge => 
      bridge[platform] && bridge[platform].channelId === id ||
      bridge[platform] && bridge[platform].chatId === id ||
      bridge[platform] && bridge[platform].groupId === id
    );
  }

  getTargetPlatforms(sourcePlatform, sourceId) {
    const bridge = this.getBridgeByPlatformId(sourcePlatform, sourceId);
    if (!bridge) return [];
    
    const targets = [];
    
    // Add other platforms from the same bridge
    Object.keys(bridge).forEach(platform => {
      if (platform !== sourcePlatform && platform !== 'id') {
        targets.push({
          platform,
          ...bridge[platform]
        });
      }
    });
    
    return targets;
  }
}

module.exports = new BridgeConfigService();
```

### **Phase 2: JSON Configuration (Growth)**
Evolve to JSON file for more flexibility:

```javascript
// src/services/bridgeConfigService.js (Enhanced)
const fs = require('fs');
const path = require('path');

class BridgeConfigService {
  constructor() {
    this.configPath = path.join(__dirname, '../config/bridges.json');
    this.bridges = this.loadBridges();
  }

  loadBridges() {
    try {
      // Try JSON file first
      if (fs.existsSync(this.configPath)) {
        const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        return config.bridges;
      }
      
      // Fallback to environment variables
      return this.loadBridgesFromEnv();
    } catch (error) {
      console.error('Failed to load bridge configuration:', error);
      return [];
    }
  }

  // ... rest of the methods
}
```

---

## **Configuration Examples**

### **Simple Setup (1 Bridge):**
```bash
# Single bridge connecting all three platforms
BRIDGE_1_DISCORD_CHANNEL=1234567890123456789
BRIDGE_1_TELEGRAM_CHAT=-1001234567890  
BRIDGE_1_COMETCHAT_GROUP=main_group_123
```

### **Multi-Bridge Setup:**
```bash
# Bridge 1: General Chat
BRIDGE_1_DISCORD_CHANNEL=1111111111111111111
BRIDGE_1_TELEGRAM_CHAT=-1001111111111
BRIDGE_1_COMETCHAT_GROUP=general_chat

# Bridge 2: Support
BRIDGE_2_DISCORD_CHANNEL=2222222222222222222  
BRIDGE_2_TELEGRAM_CHAT=-1002222222222
BRIDGE_2_COMETCHAT_GROUP=support_chat

# Bridge 3: Announcements (Discord + Telegram only)
BRIDGE_3_DISCORD_CHANNEL=3333333333333333333
BRIDGE_3_TELEGRAM_CHAT=-1003333333333
# No CometChat for this bridge
```

### **Partial Platform Bridges:**
```bash
# Bridge for Discord ↔ CometChat only (no Telegram)
BRIDGE_4_DISCORD_CHANNEL=4444444444444444444
BRIDGE_4_COMETCHAT_GROUP=private_group_456

# Bridge for Telegram ↔ CometChat only (no Discord)  
BRIDGE_5_TELEGRAM_CHAT=-1005555555555
BRIDGE_5_COMETCHAT_GROUP=mobile_users_789
```

---

## **Message Routing Logic**

```javascript
// src/services/messageRouterService.js
class MessageRouterService {
  constructor() {
    this.bridgeConfig = require('./bridgeConfigService');
  }

  async routeMessage(sourceMessage) {
    const { platform, channelId, chatId, groupId } = sourceMessage;
    
    // Find which bridge this message belongs to
    const sourcePlatformId = channelId || chatId || groupId;
    const targetPlatforms = this.bridgeConfig.getTargetPlatforms(platform, sourcePlatformId);
    
    if (targetPlatforms.length === 0) {
      console.log(`No bridge configuration found for ${platform}:${sourcePlatformId}`);
      return;
    }

    // Route to all target platforms
    for (const target of targetPlatforms) {
      try {
        await this.sendToTargetPlatform(target, sourceMessage);
      } catch (error) {
        console.error(`Failed to send to ${target.platform}:`, error);
      }
    }
  }

  async sendToTargetPlatform(target, message) {
    switch (target.platform) {
      case 'discord':
        return await this.discordService.sendMessage(target.channelId, message);
      case 'telegram':
        return await this.telegramService.sendMessage(target.chatId, message);
      case 'cometchat':
        return await this.cometChatService.sendMessage(target.groupId, message);
    }
  }
}
```

---

## **How to Get Platform IDs**

### **Discord Channel ID:**
1. Enable Developer Mode in Discord
2. Right-click channel → "Copy ID"
3. Result: `1234567890123456789`

### **Telegram Chat ID:**
1. Add bot to group/channel
2. Send a message in the group
3. Check bot updates: `https://api.telegram.org/bot<TOKEN>/getUpdates`
4. Look for `chat.id` in response
5. Result: `-1001234567890` (groups have negative IDs)

### **CometChat Group ID:**
1. Create group in CometChat Dashboard
2. Use the group ID from the dashboard
3. Result: `group_123` or custom ID

---

## **Recommended Starting Configuration**

```bash
# Add to your .env file
# Main community bridge
BRIDGE_1_DISCORD_CHANNEL=your_discord_channel_id
BRIDGE_1_TELEGRAM_CHAT=your_telegram_group_id
BRIDGE_1_COMETCHAT_GROUP=your_cometchat_group_id

# Enable bridge configuration
ENABLE_MESSAGE_BRIDGES=true
MAX_BRIDGES=10
```

This approach gives you:
- ✅ **Flexibility** - Support multiple bridges
- ✅ **Scalability** - Easy to add more platforms
- ✅ **Control** - Enable/disable specific bridges
- ✅ **Maintainability** - Clear configuration structure

Would you like me to implement the **BridgeConfigService** first, or do you want to start with a simpler environment variable approach?