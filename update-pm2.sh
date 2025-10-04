#!/bin/bash

# PM2 Configuration Update Script
# Updates PM2 to use app.js directly instead of index.js bridge

echo "=== PM2 Configuration Update ==="
echo "Updating PM2 to use app.js directly"
echo "Date: $(date)"
echo ""

echo "1. Checking current PM2 status..."
pm2 status

echo ""
echo "2. Stopping current application..."
pm2 stop cometchat-integrations

echo ""
echo "3. Deleting current PM2 process..."
pm2 delete cometchat-integrations

echo ""
echo "4. Starting with new configuration (app.js)..."
pm2 start ecosystem.config.js --env production

echo ""
echo "5. Saving PM2 configuration..."
pm2 save

echo ""
echo "6. Final PM2 status..."
pm2 status

echo ""
echo "7. Testing application..."
sleep 3
curl -s http://localhost:3001/health | jq '.version' || echo "Health check failed"

echo ""
echo "=== PM2 Update Complete ==="
echo "Application should now be running app.js directly"
echo "You can now safely remove index.js if desired"