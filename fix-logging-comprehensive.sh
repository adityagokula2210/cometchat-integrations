#!/bin/bash

# Comprehensive PM2 logging fix
# This addresses the character-by-character logging issue

echo "🔧 Comprehensive PM2 logging fix..."

# Stop the application
pm2 stop cometchat-integrations

# Kill any lingering processes
pm2 delete cometchat-integrations

# Clear all PM2 logs
pm2 flush

# Clear system logs that might be interfering
sudo journalctl --vacuum-time=1h

# Update PM2 to latest version (if needed)
npm list -g pm2

# Restart PM2 daemon to clear any issues
pm2 kill
pm2 resurrect

# Start the application with explicit log configuration
pm2 start ecosystem.config.js --env production --log-type json

# Save the configuration
pm2 save

echo "✅ PM2 restarted with clean configuration"
echo "📋 Testing logs..."

# Wait a moment
sleep 3

# Generate a test request
curl -s http://localhost:3001/health > /dev/null

# Show recent logs
echo "📋 Recent logs (should be normal now):"
pm2 logs cometchat-integrations --lines 5 --raw