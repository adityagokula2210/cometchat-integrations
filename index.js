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

// Telegram POST route for webhook/data processing
app.post('/telegram', (req, res) => {
    try {
        const { body } = req;
        
        console.log('📥 Received Telegram POST request:', {
            timestamp: new Date().toISOString(),
            body: body,
            headers: req.headers
        });

        // Process the incoming data here
        // This could be a Telegram webhook, CometChat integration data, etc.
        
        res.status(200).json({
            success: true,
            message: 'Telegram data received successfully',
            timestamp: new Date().toISOString(),
            received: {
                bodySize: JSON.stringify(body).length,
                hasData: Object.keys(body).length > 0
            }
        });
        
    } catch (error) {
        console.error('❌ Error processing Telegram POST:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error processing Telegram data',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
    console.log(`API root available at: http://localhost:${PORT}/`);
});