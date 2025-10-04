#!/bin/bash

# Migration script to bring server up to date and fix logging
# Run this if auto-deployment is not working

echo "🔄 Manual deployment and logging fix migration..."

# Check current status
echo "📍 Current commit: $(git log --oneline -1)"
echo "📍 Current directory: $(pwd)"

# Force update to latest
echo "📥 Fetching latest changes..."
git fetch origin
git reset --hard origin/main

echo "✅ Updated to: $(git log --oneline -1)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create the comprehensive logging fix if it doesn't exist
if [ ! -f "fix-logging-comprehensive.sh" ]; then
    echo "🛠️ Creating logging fix script..."
    cat > fix-logging-comprehensive.sh << 'EOF'
#!/bin/bash

echo "🔧 Comprehensive PM2 logging fix..."

# Stop and clean PM2
pm2 stop cometchat-integrations
pm2 delete cometchat-integrations
pm2 flush

# Clear system logs
sudo journalctl --vacuum-time=1h

# Restart PM2 daemon
pm2 kill
sleep 2

# Start with new configuration
pm2 start ecosystem.config.js --env production
pm2 save

echo "✅ PM2 restarted with clean configuration"
sleep 3

# Test
curl -s http://localhost:3001/health > /dev/null
pm2 logs cometchat-integrations --lines 5 --raw
EOF
    chmod +x fix-logging-comprehensive.sh
fi

# Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart cometchat-integrations

# Run the logging fix
echo "🔧 Running logging fix..."
./fix-logging-comprehensive.sh

echo "🎉 Migration complete!"