/**
 * Discord Routes
 * Routes for Discord webhook handling and API interactions
 */

const express = require('express');
const DiscordController = require('../controllers/discordController');
const webhookAuth = require('../middleware/webhookAuth');

const router = express.Router();

// GET /discord - Get service information
router.get('/discord', DiscordController.getInfo);

// POST /discord - Handle Discord webhooks
router.post('/discord', 
  webhookAuth('discord'), 
  DiscordController.handleWebhook
);

module.exports = router;