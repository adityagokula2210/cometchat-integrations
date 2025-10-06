# Message Syncing Implementation Plan
## Bidirectional Integration: Telegram ↔ CometChat ↔ Discord

### 🎯 **Objective**
Implement real-time message synchronization between three platforms:
- **Telegram** (via Bot API + Webhooks)
- **CometChat** (via REST API + Webhooks) 
- **Discord** (via Gateway Bot + REST API)

### 🏗️ **Current Architecture Status**

#### ✅ **Already Implemented:**
- **Discord Gateway Bot** - Real-time message listening ✓
- **Telegram Webhook** - Incoming message handling ✓
- **CometChat Webhook** - Incoming message handling ✓
- **Health Monitoring** - All services status ✓
- **Logging System** - Unified logging ✓

#### 🔧 **Need to Implement:**
- **Message Forwarding Logic** - Route messages between platforms
- **API Clients** - Send messages to each platform
- **Duplicate Prevention** - Avoid message loops
- **Message Formatting** - Handle different message types
- **Error Handling** - Retry logic and fallbacks

---

## 📋 **Implementation Phases**

### **Phase 1: Message Routing Architecture** 
**Estimated Time: 2-3 hours**

#### 1.1 Create Message Router Service
```javascript
// src/services/messageRouterService.js
- Central message routing logic
- Platform-agnostic message format
- Routing rules and filtering
- Duplicate prevention
```

#### 1.2 Define Message Schema
```javascript
// Standardized message format
{
  id: 'unique_message_id',
  source: 'telegram|cometchat|discord',
  author: { name, id, avatar },
  content: { text, attachments, mentions },
  channel: { id, name, type },
  timestamp: '2025-10-06T12:00:00Z',
  metadata: { platform_specific_data }
}
```

#### 1.3 Update Existing Handlers
- Modify Discord Gateway message handler
- Update Telegram webhook handler  
- Update CometChat webhook handler

---

### **Phase 2: API Client Services**
**Estimated Time: 3-4 hours**

#### 2.1 Telegram API Client
```javascript
// src/services/telegramApiService.js
- sendMessage(chatId, text, options)
- sendPhoto(chatId, photo, caption)
- sendDocument(chatId, document)
- Error handling and rate limiting
```

#### 2.2 CometChat API Client
```javascript
// src/services/cometChatApiService.js  
- sendMessage(receiverId, text, receiverType)
- sendMediaMessage(receiverId, attachment)
- getUserInfo(userId)
- Error handling and rate limiting
```

#### 2.3 Discord API Client
```javascript
// src/services/discordApiService.js
- sendMessage(channelId, content, embeds)
- sendFile(channelId, file, filename)
- editMessage(channelId, messageId, content)
- Error handling and rate limiting
```

---

### **Phase 3: Message Processing Pipeline**
**Estimated Time: 2-3 hours**

#### 3.1 Message Processor
```javascript
// src/services/messageProcessorService.js
- Transform messages between platform formats
- Handle mentions (@username conversions)
- Process attachments (images, files)
- Handle emojis and special characters
- Apply message filtering rules
```

#### 3.2 Bridge Configuration
```javascript
// Environment variables for bridge mapping
DISCORD_BRIDGE_CHANNEL_ID=123456789
TELEGRAM_BRIDGE_CHAT_ID=-100123456789  
COMETCHAT_BRIDGE_USER_ID=user123
COMETCHAT_BRIDGE_GROUP_ID=group456
```

#### 3.3 Message Queue (Optional)
```javascript
// For handling high-volume scenarios
- Queue failed messages for retry
- Rate limiting across platforms
- Batch processing capabilities
```

---

### **Phase 4: Loop Prevention & Validation**
**Estimated Time: 1-2 hours**

#### 4.1 Duplicate Detection
```javascript
// Track message origins to prevent loops
- Message fingerprinting
- Origin tracking with TTL cache
- Bot message filtering
```

#### 4.2 Message Validation
```javascript
- Content length limits per platform
- Allowed file types and sizes
- User permission validation
- Spam detection
```

---

### **Phase 5: Enhanced Features**
**Estimated Time: 2-3 hours**

#### 5.1 Rich Message Support
- **Embeds** - Convert between platform formats
- **Reactions** - Sync reactions/emojis
- **Replies** - Handle threaded conversations
- **Mentions** - Cross-platform user mentions

#### 5.2 File Handling
- **Images** - Resize and convert formats
- **Documents** - File type validation
- **Voice Messages** - Platform compatibility
- **Videos** - Size and format conversion

#### 5.3 User Mapping
```javascript
// Optional: Map users across platforms
{
  discord_id: "123456789",
  telegram_id: "987654321", 
  cometchat_id: "user123",
  display_name: "John Doe"
}
```

---

## 🔄 **Message Flow Architecture**

### **Incoming Message Flow:**
```
Platform → Webhook/Gateway → Router → Processor → API Clients → Other Platforms
```

### **Example Flow:**
```
1. Discord user sends: "Hello from Discord! 👋"
2. Discord Gateway catches message
3. Router standardizes format
4. Processor transforms for each platform:
   - Telegram: "Hello from Discord! 👋"
   - CometChat: "Hello from Discord! 👋"
5. API clients send to respective platforms
6. Loop prevention ensures no echo back
```

---

## 📁 **File Structure**
```
src/
├── services/
│   ├── messageRouterService.js      ← Central routing logic
│   ├── messageProcessorService.js   ← Format transformations
│   ├── telegramApiService.js        ← Telegram API client
│   ├── cometChatApiService.js       ← CometChat API client
│   ├── discordApiService.js         ← Discord API client
│   └── messageCacheService.js       ← Duplicate prevention
├── controllers/
│   ├── telegramController.js        ← Update with router calls
│   ├── cometChatController.js       ← Update with router calls
│   └── (discordController removed)
└── utils/
    ├── messageFormatter.js          ← Cross-platform formatting
    └── platformValidator.js         ← Message validation
```

---

## 🧪 **Testing Strategy**

### **Unit Testing:**
- Message transformation logic
- API client methods
- Duplicate detection
- Message validation

### **Integration Testing:**
- End-to-end message flow
- Error handling scenarios
- Rate limiting behavior
- Loop prevention

### **Manual Testing:**
- Send test messages from each platform
- Verify formatting preservation
- Test file/image forwarding
- Confirm no message loops

---

## 🚦 **Implementation Priority**

### **High Priority (MVP):**
1. ✅ Message routing architecture
2. ✅ Basic text message forwarding
3. ✅ Loop prevention
4. ✅ Error handling

### **Medium Priority:**
1. ⚡ File/image forwarding
2. ⚡ Message formatting improvements
3. ⚡ Rate limiting
4. ⚡ Retry logic

### **Low Priority (Future):**
1. 🔮 Reaction syncing
2. 🔮 User mapping
3. 🔮 Advanced message types
4. 🔮 Analytics/reporting

---

## 🛠️ **Next Steps**

**Ready to start implementation?**

1. **Begin with Phase 1** - Message Router Service
2. **Test incrementally** - One platform integration at a time
3. **Validate thoroughly** - Ensure no message loops
4. **Scale gradually** - Add features progressively

Would you like me to start implementing **Phase 1: Message Router Service** first?