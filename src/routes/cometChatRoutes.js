/**
 * CometChat Routes
 * Routes for CometChat webhook handling and API interactions
 */

const express = require('express');
const CometChatController = require('../controllers/cometChatController');
const webhookAuth = require('../middleware/webhookAuth');

const router = express.Router();

// GET /cometchat - Get service information
router.get('/cometchat', CometChatController.getInfo);

// POST /cometchat - Handle CometChat webhooks
router.post('/cometchat', 
  webhookAuth('cometchat'), 
  CometChatController.handleWebhook
);

// POST /cometchat - Handle CometChat webhooks (with permissive auth)
router.post('/cometchat', 
  webhookAuth('cometchat'), 
  CometChatController.handleWebhook
);

module.exports = router;