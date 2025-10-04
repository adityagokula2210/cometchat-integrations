/**
 * Health Routes
 * Routes for health checks and system status
 */

const express = require('express');
const HealthController = require('../controllers/healthController');

const router = express.Router();

// GET /health - Health check endpoint
router.get('/health', HealthController.getHealth);

// GET /status - System status endpoint  
router.get('/status', HealthController.getStatus);

module.exports = router;