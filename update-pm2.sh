#!/bin/bash

# Update PM2 script - Force update and fix everything
# Run this to manually bring server up to date

echo "🔄 Comprehensive server update and PM2 fix..."

# 1. Force update to latest code
echo "📥 Force updating to latest commit..."
git fetch origin
git reset --hard origin/main

echo "✅ Updated to: $(git log --oneline -1)"

# 2. Clean npm completely
echo "🧹 Cleaning npm and dependencies..."
rm -rf node_modules package-lock.json
npm cache clean --force

# 3. Install only production dependencies
echo "📦 Installing production dependencies..."
npm install --omit=dev --no-optional

# 4. Verify dependencies
echo "🔍 Checking dependencies..."
npm ls --depth=0 --production

# 5. Stop and reset PM2 completely
echo "💀 Resetting PM2 completely..."
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
pm2 kill

# 6. Clear all PM2 logs
echo "🧹 Clearing all logs..."
pm2 flush
rm -rf ~/.pm2/logs/* 2>/dev/null
sudo journalctl --vacuum-time=1s 2>/dev/null

# 7. Start fresh with ecosystem config
echo "🚀 Starting with new ecosystem config..."
pm2 start ecosystem.config.js --env production

# 8. Save PM2 config
pm2 save

# 9. Test the application
echo "📋 Testing application..."
sleep 5

# Test health endpoint
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Application is responding"
else
    echo "❌ Application not responding"
fi

# Show recent logs
echo "📋 Recent logs (should be clean now):"
pm2 logs cometchat-integrations --lines 10 --raw

echo "🎉 Update complete!"