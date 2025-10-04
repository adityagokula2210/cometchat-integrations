/**
 * Telegram Routes
 * Routes for Telegram webhook handling and API interactions
 */

const express = require('express');
const TelegramController = require('../controllers/telegramController');
const webhookAuth = require('../middleware/webhookAuth');

const router = express.Router();

// GET /telegram - Get service information
router.get('/telegram', TelegramController.getInfo);

// POST /telegram - Handle Telegram webhooks
router.post('/telegram', 
  webhookAuth('telegram'), 
  TelegramController.handleWebhook
);

module.exports = router;