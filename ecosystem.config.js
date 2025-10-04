module.exports = {
  apps: [{
    name: 'cometchat-integrations',
    script: 'app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    // Force raw logging to prevent character-by-character output
    log_type: 'raw',
    merge_logs: true,
    log_date_format: '',
    disable_logs: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      SIMPLE_LOGGING: 'true'  // Force simple logging
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000
    }
  }]
};