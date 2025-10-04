#!/bin/bash

# Fix PM2 logging issues
# Run this on your production server from /var/www/cometchat-integrations

echo "🔧 Fixing PM2 logging issues..."
echo "📍 Current directory: $(pwd)"

# Stop the application
echo "⏹️ Stopping PM2 application..."
pm2 stop cometchat-integrations

# Clear PM2 logs
echo "🧹 Clearing PM2 logs..."
pm2 flush

# Update PM2 configuration for better logging
echo "🗑️ Deleting old PM2 process..."
pm2 delete cometchat-integrations

# Restart with better logging configuration
echo "🚀 Starting application with ecosystem config..."
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Monitor logs
echo "📋 Current PM2 status:"
pm2 status

echo "📋 Recent logs (press Ctrl+C to stop monitoring):"
pm2 logs cometchat-integrations --lines 20