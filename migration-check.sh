#!/bin/bash

# Migration verification script
# Checks if all components are properly configured after migration

echo "� Checking post-migration system status..."

# Check if running on correct port
if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    echo "✅ Application running on port 3001"
else
    echo "❌ Application not responding on port 3001"
fi

# Check HTTPS
if curl -f https://adityagokula.com/cometchat-integrations/health > /dev/null 2>&1; then
    echo "✅ HTTPS endpoint accessible"
else
    echo "❌ HTTPS endpoint not accessible"
fi

# Check PM2 status
if pm2 list | grep -q "cometchat-integrations"; then
    echo "✅ PM2 process running"
else
    echo "❌ PM2 process not found"
fi

# Check nginx
if sudo systemctl is-active nginx > /dev/null 2>&1; then
    echo "✅ Nginx service active"
else
    echo "❌ Nginx service not active"
fi

echo "🎉 Migration check complete!"