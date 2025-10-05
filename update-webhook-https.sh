#!/bin/bash

# Update webhook URLs from HTTP to HTTPS
# This script is for reference - run manually if needed

DOMAIN="adityagokula.com"
NEW_URL="https://${DOMAIN}/cometchat-integrations/telegram"

echo "🔄 This script helps update webhook URLs to HTTPS"
echo "📍 New webhook URL: ${NEW_URL}"
echo ""

# For Telegram Bot
echo "📱 For Telegram Bot API, use:"
echo "curl -X POST \"https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"url\": \"${NEW_URL}\"}'"
echo ""

# For CometChat
echo "🗨️ For CometChat webhooks, update in dashboard:"
echo "   - Login to CometChat dashboard"
echo "   - Navigate to Extensions → Webhooks"
echo "   - Update URL to: ${NEW_URL}"
echo ""

echo "✅ Use these commands manually to update your webhooks"te Telegram webhook to use HTTPS
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