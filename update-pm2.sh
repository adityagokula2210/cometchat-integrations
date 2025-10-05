#!/bin/bash

# PM2 Update and Restart Script
# Use this to manually update and restart the application

echo "🔄 Updating application..."

# Force update to latest code
echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/main
echo "✅ Updated to: $(git log --oneline -1)"

# Clean and install dependencies
echo "📦 Installing dependencies..."
rm -rf node_modules package-lock.json
npm cache clean --force
npm install --omit=dev --no-optional

# Restart PM2
echo "� Restarting PM2..."
pm2 restart cometchat-integrations
pm2 save

# Test the application
echo "📋 Testing application..."
sleep 3
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Application is running"
else
    echo "❌ Application not responding"
fi

echo "🎉 Update complete!"