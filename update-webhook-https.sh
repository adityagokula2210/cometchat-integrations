#!/bin/bash

# Update Telegram webhook to use HTTPS
# Run this AFTER SSL is set up successfully

# Your bot token (from your .env file)
BOT_TOKEN="8071360428:AAFlSzdD2wf_FpwxzPMOAf8uP5Im0uP6KJ8"

# Set webhook to HTTPS URL
echo "🔄 Updating Telegram webhook to HTTPS..."
curl -F "url=https://adityagokula.com/cometchat-integrations/telegram" \
     "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook"

echo ""
echo "✅ Webhook updated to HTTPS!"

# Check webhook info
echo "📋 Current webhook info:"
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | python3 -m json.tool