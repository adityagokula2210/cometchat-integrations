# Discord Bot Setup Instructions

## 🚨 **IMPORTANT: Discord Bot Intents Configuration Required**

To receive Discord messages, your bot needs **privileged intents** enabled in the Discord Developer Portal.

---

## 🔧 **Step 1: Configure Discord Bot Intents**

### **Go to Discord Developer Portal:**
1. Visit: https://discord.com/developers/applications
2. Select your application: `MTQyNjE0MzgyMTE3MzIyNzczQ` (from your bot token)
3. Go to **"Bot"** section in the left sidebar

### **Enable Required Intents:**
In the **"Privileged Gateway Intents"** section, enable:

- ✅ **PRESENCE INTENT** (optional)
- ✅ **SERVER MEMBERS INTENT** (optional) 
- ✅ **MESSAGE CONTENT INTENT** ⚠️ **REQUIRED!**

**⚠️ CRITICAL:** The **"MESSAGE CONTENT INTENT"** is required to read message content. Without this, the bot can see that messages exist but cannot read their content.

---

## 🎯 **Step 2: Bot Permissions**

### **In the Discord Developer Portal:**
1. Go to **"OAuth2"** → **"URL Generator"**
2. Select **Scopes:**
   - ✅ `bot`

3. Select **Bot Permissions:**
   - ✅ `View Channels`
   - ✅ `Send Messages`
   - ✅ `Read Message History`
   - ✅ `Use Slash Commands` (optional)

4. Copy the generated URL and use it to invite the bot to your Discord server

---

## 🏠 **Step 3: Add Bot to Your Discord Server**

1. Use the OAuth2 URL from Step 2
2. Select the Discord server where you want to test
3. Authorize the bot with the required permissions

---

## 🧪 **Step 4: Test the Integration**

### **Start the Application:**
```bash
npm start
```

### **Expected Console Output:**
```
🚀 Server started successfully
🤖 Initializing Discord Gateway Bot...
✅ Discord Gateway Bot initialized successfully
```

### **Send a Test Message:**
1. Go to your Discord server
2. Type any message in a channel where the bot has access
3. Check your console for the message log:

```
🎭 DISCORD MESSAGE RECEIVED:
📅 Time: 10/6/2025, 1:22:30 AM
👤 Author: Your Name (@your_username)
🏠 Server: Your Server Name
📢 Channel: #general
💬 Content: Hello from Discord!
────────────────────────────────────────────────────────
```

---

## 🔍 **Troubleshooting**

### **Error: "Used disallowed intents"**
- ✅ **Solution:** Enable "MESSAGE CONTENT INTENT" in Discord Developer Portal
- ✅ **Check:** Bot section → Privileged Gateway Intents

### **Error: "Missing Permissions"**
- ✅ **Solution:** Re-invite bot with proper permissions using OAuth2 URL
- ✅ **Check:** Bot has "View Channels" and "Read Message History" permissions

### **Bot connects but doesn't log messages:**
- ✅ **Check:** MESSAGE CONTENT INTENT is enabled
- ✅ **Check:** Bot is in the same channel where you're sending messages
- ✅ **Check:** Messages are not from other bots (bot messages are filtered out)

### **Environment Variables:**
Make sure your `.env` file has:
```env
DISCORD_BOT_TOKEN=MTQyNjE0MzgyMTE3MzIyNzczQ.GQmb6X.Fy13BlutoTDmpJyxmutDRf0MAfURraGK_3u078
```

---

## 📊 **Health Check**

After the bot is running, check the health endpoint:
```bash
curl http://localhost:3000/health
```

Look for Discord status:
```json
{
  "services": {
    "discord": {
      "configured": true,
      "gateway": {
        "connected": true,
        "ready": true,
        "guilds": 1,
        "ping": 45
      }
    }
  }
}
```

---

## 🎉 **Success Indicators**

1. ✅ Server starts without errors
2. ✅ Console shows "Discord Gateway Bot initialized successfully"
3. ✅ Health check shows Discord gateway as connected
4. ✅ Messages in Discord appear in your console with full details
5. ✅ No "disallowed intents" or permission errors

Once you see messages being logged to the console, the Discord Gateway Bot is working correctly and ready for the next phase of message forwarding! 🚀