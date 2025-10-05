/**
 * CometChat Integrations Server
 * A well-architected Node.js Express server for handling CometChat and Telegram integrations
 */

const express = require('express');
const config = require('./src/config');
const logger = require('./src/utils/logger');

// Middleware
const webhookLogger = require('./src/middleware/webhookLogger');
const errorHandler = require('./src/middleware/errorHandler');

// Routes
const rootRoutes = require('./src/routes/rootRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const cometChatRoutes = require('./src/routes/cometChatRoutes');
const telegramRoutes = require('./src/routes/telegramRoutes');
const discordRoutes = require('./src/routes/discordRoutes');

// Initialize Express app
const app = express();

// Trust proxy for deployment behind reverse proxy
app.set('trust proxy', config.server.trustProxy);

// Global middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(webhookLogger);  // Unified webhook and request logging

// Routes
app.use('/', rootRoutes);
app.use('/', healthRoutes);
app.use('/', cometChatRoutes);
app.use('/', telegramRoutes);
app.use('/', discordRoutes);

// 404 handler
app.use((req, res) => {
  logger.warn('404 - Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });
  
  res.status(404).json({
    success: false,
    message: 'Route not found',
    timestamp: new Date().toISOString(),
    availableRoutes: {
      health: 'GET /health',
      status: 'GET /status', 
      root: 'GET /',
      cometchat: 'GET|POST /cometchat',
      telegram: 'GET|POST /telegram',
      discord: 'GET|POST /discord'
    }
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = () => {
  const PORT = config.server.port;
  
  app.listen(PORT, () => {
    logger.info('🚀 Server started successfully', {
      port: PORT,
      environment: config.server.env,
      version: '2.0.1',
      endpoints: {
        health: `http://localhost:${PORT}/health`,
        api: `http://localhost:${PORT}/`,
        cometchat: `http://localhost:${PORT}/cometchat`,
        telegram: `http://localhost:${PORT}/telegram`,
        discord: `http://localhost:${PORT}/discord`
      }
    });
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    process.exit(0);
  });
};

// Start the server
startServer();

module.exports = app;