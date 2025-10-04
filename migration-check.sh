#!/bin/bash

# Migration script to ensure smooth transition from old to new architecture
# This script can be run on the server to debug deployment issues

echo "=== CometChat Integrations Architecture Migration ==="
echo "Date: $(date)"
echo ""

echo "1. Checking Node.js version..."
node --version
echo ""

echo "2. Checking if app.js exists..."
if [ -f "app.js" ]; then
    echo "✅ app.js found"
else
    echo "❌ app.js not found"
fi
echo ""

echo "3. Checking if src directory exists..."
if [ -d "src" ]; then
    echo "✅ src directory found"
    echo "   Contents:"
    ls -la src/
else
    echo "❌ src directory not found"
fi
echo ""

echo "4. Testing app.js syntax..."
node -c app.js
if [ $? -eq 0 ]; then
    echo "✅ app.js syntax is valid"
else
    echo "❌ app.js has syntax errors"
fi
echo ""

echo "5. Checking package.json main entry..."
main_entry=$(node -p "require('./package.json').main")
echo "Main entry point: $main_entry"
echo ""

echo "6. Testing dependencies..."
npm ls --depth=0
echo ""

echo "7. Checking current git commit..."
git log --oneline -1
echo ""

echo "8. PM2 status..."
pm2 status || echo "PM2 not running or accessible"
echo ""

echo "=== Migration Check Complete ==="