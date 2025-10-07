/**
 * CometChat Routes
 * Routes for CometChat webhook handling and API interactions
 */

const express = require('express');
const CometChatController = require('../controllers/cometChatController');
const webhookAuth = require('../middleware/webhookAuth');
const logger = require('../utils/logger');

const router = express.Router();

// GET /cometchat - Get service information
router.get('/cometchat', CometChatController.getInfo);

// POST /cometchat - Handle CometChat webhooks
router.post('/cometchat', 
  (req, res, next) => {
    logger.info('🎯 COMETCHAT ROUTE - POST Handler Reached', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      timestamp: new Date().toISOString(),
      hasBody: !!(req.body && Object.keys(req.body).length > 0),
      bodyKeys: req.body ? Object.keys(req.body) : [],
      trigger: req.body ? req.body.trigger : 'No trigger',
      appId: req.body ? req.body.appId : 'No appId',
      contentType: req.get('Content-Type'),
      userAgent: req.get('User-Agent')
    });
    next();
  },
  webhookAuth('cometchat'), 
  CometChatController.handleWebhook
);

module.exports = router;