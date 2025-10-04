const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Handle deployment behind reverse proxy
app.set('trust proxy', 1);

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'CometChat Integrations server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        deployment: 'auto-deploy-working-v1.5'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to CometChat Integrations!',
        service: 'Telegram Integration',
        version: '1.0.1',
        lastUpdated: new Date().toISOString(),
        endpoints: {
            health: '/health',
            root: '/',
            telegram: '/telegram'
        }
    });
});

// Telegram-specific routes
app.get('/telegram', (req, res) => {
    res.json({
        message: 'CometChat Telegram Integration',
        status: 'active',
        version: '1.0.0'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
    console.log(`API root available at: http://localhost:${PORT}/`);
});