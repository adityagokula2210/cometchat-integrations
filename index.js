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
            telegram: '/telegram',
            cometchat: '/cometchat'
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

// CometChat POST route for data processing
app.post('/cometchat', (req, res) => {
    try {
        const { body } = req;
        
        console.log('📥 Received CometChat POST request:');
        console.log('Timestamp:', new Date().toISOString());
        console.log('Full Body:', JSON.stringify(body, null, 2));
        console.log('Headers:', JSON.stringify(req.headers, null, 2));
        
        // Log specific CometChat webhook details
        if (body.trigger) {
            console.log('🔔 Webhook Trigger:', body.trigger);
        }
        if (body.data && body.data.message) {
            console.log('💬 Message Details:', JSON.stringify(body.data.message, null, 2));
        }
        if (body.appId) {
            console.log('📱 App ID:', body.appId);
        }

        // Process the incoming CometChat data here
        // This could be CometChat webhooks, user events, messages, etc.
        
        res.status(200).json({
            success: true,
            message: 'CometChat data received successfully',
            timestamp: new Date().toISOString(),
            received: {
                bodySize: JSON.stringify(body).length,
                hasData: Object.keys(body).length > 0,
                service: 'cometchat'
            }
        });
        
    } catch (error) {
        console.error('❌ Error processing CometChat POST:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error processing CometChat data',
            error: error.message,
            timestamp: new Date().toISOString(),
            service: 'cometchat'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/health`);
    console.log(`API root available at: http://localhost:${PORT}/`);
});