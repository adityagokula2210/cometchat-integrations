#!/bin/bash

# Ultra-aggressive PM2 logging fix
# This completely resets PM2 and uses raw console output

echo "🔧 Ultra-aggressive PM2 logging fix..."

# 1. Stop everything
echo "⏹️ Stopping all PM2 processes..."
pm2 stop all
pm2 delete all

# 2. Kill PM2 completely
echo "💀 Killing PM2 daemon..."
pm2 kill

# 3. Clear all logs everywhere
echo "🧹 Clearing all logs..."
pm2 flush
sudo rm -rf ~/.pm2/logs/*
sudo journalctl --vacuum-time=1s

# 4. Update ecosystem config to disable JSON logging
echo "⚙️ Updating PM2 config..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'cometchat-integrations',
    script: 'app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    // Disable all PM2 log formatting
    log_type: 'raw',
    merge_logs: true,
    log_date_format: '',
    disable_logs: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      // Force simple logging
      SIMPLE_LOGGING: 'true'
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000
    }
  }]
};
EOF

# 5. Update the logger to use raw console output
echo "🖨️ Updating logger for raw output..."
cat > src/utils/productionLogger.js << 'EOF'
/**
 * Production Logger - Raw Console Output Only
 * Completely bypasses PM2 JSON formatting
 */

class ProductionLogger {
  static log(level, message, meta = {}) {
    // Use process.stdout.write for direct output
    const timestamp = new Date().toISOString();
    
    // Simple format: [TIMESTAMP] LEVEL: MESSAGE
    let output = `[${timestamp}] ${level}: ${String(message)}`;
    
    // Add meta as simple key=value
    if (meta && Object.keys(meta).length > 0) {
      const metaStr = Object.entries(meta)
        .map(([k, v]) => `${k}=${v}`)
        .join(' ');
      output += ` (${metaStr})`;
    }
    
    // Write directly to stdout/stderr
    if (level === 'ERROR') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }
  }

  static info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  static error(message, meta = {}) {
    this.log('ERROR', message, meta);
  }

  static warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  static debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }
}

module.exports = ProductionLogger;
EOF

# 6. Update main logger to use production logger
echo "🔄 Updating main logger..."
sed -i 's/const SimpleLogger = require.*$/const ProductionLogger = require("\.\/productionLogger");/' src/utils/logger.js
sed -i 's/SimpleLogger\.log/ProductionLogger.log/g' src/utils/logger.js

# 7. Start PM2 fresh
echo "🚀 Starting PM2 with new configuration..."
pm2 start ecosystem.config.js --env production

# 8. Save configuration
pm2 save

# 9. Test logging
echo "📋 Testing new logging..."
sleep 3
curl -s http://localhost:3001/health > /dev/null

echo "✅ Fix complete! Checking logs:"
pm2 logs cometchat-integrations --lines 5 --raw