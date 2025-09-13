const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const swaggerUi = require('swagger-ui-express');
const { generateSwaggerSpec } = require('./config/swagger');

const app = express();
const PORT = process.env.PORT || 3000;

// Swagger configuration
const swaggerSpec = generateSwaggerSpec(PORT);

// Middleware
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Initialize WhatsApp client
const client = new Client({
    authStrategy: new LocalAuth(),
    // puppeteer: {
    //     headless: true,
    //     // Use system Chrome instead of downloading Chromium
    //     // executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium'
    // }
});

let isClientReady = false;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
let reconnectTimeout;

// WhatsApp client events
client.on('qr', (qr) => {
    console.log('QR Code received, scan it with your WhatsApp app:');
    qrcode.generate(qr, { small: true });
    reconnectAttempts = 0; // Reset reconnect attempts on QR
});

client.on('ready', () => {
    console.log('WhatsApp client is ready!');
    isClientReady = true;
    reconnectAttempts = 0; // Reset reconnect attempts on ready
});

client.on('authenticated', () => {
    console.log('WhatsApp client authenticated');
});

client.on('auth_failure', (msg) => {
    console.error('Authentication failed:', msg);
    isClientReady = false;
});

client.on('disconnected', (reason) => {
    console.log('WhatsApp client disconnected:', reason);
    isClientReady = false;

    // Handle different disconnection reasons
    if (reason === 'LOGOUT') {
        console.log('User logged out. Please scan QR code again.');
        reconnectAttempts = 0;
    } else if (reason === 'NAVIGATION') {
        console.log('Navigation error detected. Attempting to reconnect...');
        attemptReconnect();
    } else {
        console.log('Unexpected disconnection. Attempting to reconnect...');
        attemptReconnect();
    }
});

// Reconnection logic
const attemptReconnect = () => {
    if (reconnectAttempts >= maxReconnectAttempts) {
        console.error('Max reconnection attempts reached. Please restart the application.');
        return;
    }

    reconnectAttempts++;
    console.log(`Attempting to reconnect... (${reconnectAttempts}/${maxReconnectAttempts})`);

    // Clear any existing timeout
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
    }

    // Wait before attempting reconnection
    reconnectTimeout = setTimeout(() => {
        try {
            client.initialize();
        } catch (error) {
            console.error('Reconnection failed:', error.message);
            attemptReconnect();
        }
    }, 5000 * reconnectAttempts); // Exponential backoff
};

// Initialize WhatsApp client
client.initialize();

// API Routes

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get API information
 *     description: Returns basic information about the WhatsApp OTP API
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiInfoResponse'
 */
app.get('/', (req, res) => {
    res.json({
        message: 'WhatsApp OTP API is running',
        status: isClientReady ? 'ready' : 'not ready',
        endpoints: {
            sendOTP: 'POST /send-otp',
            status: 'GET /status',
            docs: 'GET /api-docs'
        }
    });
});

/**
 * @swagger
 * /status:
 *   get:
 *     summary: Check WhatsApp client status
 *     description: Returns the current status of the WhatsApp client
 *     tags: [General]
 *     responses:
 *       200:
 *         description: Status information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StatusResponse'
 */
app.get('/status', (req, res) => {
    res.json({
        status: isClientReady ? 'ready' : 'not ready',
        message: isClientReady ? 'WhatsApp client is ready to send messages' : 'WhatsApp client is not ready. Please scan QR code.'
    });
});

/**
 * @swagger
 * /send-otp:
 *   post:
 *     summary: Send OTP via WhatsApp
 *     description: Sends an OTP code to the specified recipient via WhatsApp
 *     tags: [OTP]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendOTPRequest'
 *           examples:
 *             example1:
 *               summary: Send OTP to phone number
 *               value:
 *                 recipient: "1234567890"
 *                 otp: "123456"
 *             example2:
 *               summary: Send OTP to WhatsApp ID
 *               value:
 *                 recipient: "1234567890@c.us"
 *                 otp: "654321"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Both recipient and otp are required"
 *       503:
 *         description: Service unavailable - WhatsApp client not ready
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "WhatsApp client is not ready. Please scan QR code first."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to send OTP"
 *               error: "Detailed error message"
 */
// Main OTP endpoint
app.post('/send-otp', async (req, res) => {
    try {
        const { recipient, otp } = req.body;

        // Validate input
        if (!recipient || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Both recipient and otp are required'
            });
        }

        // Check if WhatsApp client is ready
        if (!isClientReady) {
            return res.status(503).json({
                success: false,
                message: 'WhatsApp client is not ready. Please scan QR code first.'
            });
        }

        // Format recipient number (ensure it includes country code)
        let formattedNumber = recipient;
        if (!recipient.includes('@c.us')) {
            // Remove any non-digit characters except +
            formattedNumber = recipient.replace(/[^\d+]/g, '');

            // Add @c.us suffix if not present
            if (!formattedNumber.includes('@c.us')) {
                formattedNumber = formattedNumber + '@c.us';
            }
        }

        // Create OTP message
        const message = `Your OTP code is: ${otp}\n\nThis code will expire in 5 minutes. Do not share this code with anyone.`;

        // Send message with retry logic
        let result;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                result = await client.sendMessage(formattedNumber, message);
                break; // Success, exit retry loop
            } catch (error) {
                retryCount++;
                console.error(`Send message attempt ${retryCount} failed:`, error.message);

                if (retryCount >= maxRetries) {
                    throw error; // Re-throw if all retries failed
                }

                // Wait before retry (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
            }
        }

        res.json({
            success: true,
            message: 'OTP sent successfully',
            data: {
                recipient: formattedNumber,
                messageId: result.id._serialized,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`WhatsApp OTP API server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to see the API status`);
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit the process, just log the error
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Attempt to reconnect if it's a WhatsApp-related error
    if (error.message.includes('Execution context was destroyed') ||
        error.message.includes('Protocol error') ||
        error.message.includes('Target closed')) {
        console.log('Detected WhatsApp connection error. Attempting to reconnect...');
        attemptReconnect();
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
    }
    try {
        await client.destroy();
    } catch (error) {
        console.error('Error during shutdown:', error.message);
    }
    process.exit(0);
});
