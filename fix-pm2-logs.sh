#!/bin/bash

# Fix PM2 logging issues
# Run this on your production server

echo "🔧 Fixing PM2 logging issues..."

# Stop the application
pm2 stop cometchat-integrations

# Clear PM2 logs
pm2 flush

# Update PM2 configuration for better logging
pm2 delete cometchat-integrations

# Restart with better logging configuration
pm2 start ecosystem.config.js --env production

# Monitor logs
echo "📋 Monitoring logs (press Ctrl+C to stop):"
pm2 logs cometchat-integrations --lines 50