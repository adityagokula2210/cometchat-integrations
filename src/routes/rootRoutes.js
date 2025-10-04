/**
 * Root Routes
 * Root endpoint routes
 */

const express = require('express');
const RootController = require('../controllers/rootController');

const router = express.Router();

// GET / - Root API information endpoint
router.get('/', RootController.getApiInfo);

module.exports = router;