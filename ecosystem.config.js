module.exports = {
  apps: [{
    name: 'cometchat-integrations',
    script: 'app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_development: {
      NODE_ENV: 'development',
      PORT: 3000
    }
  }]
};