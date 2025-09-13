const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Swagger configuration options
 * @param {number} port - Server port for the base URL
 * @returns {Object} Swagger configuration object
 */
const createSwaggerOptions = (port) => ({
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'WhatsApp OTP API',
            version: '1.0.0',
            description: 'A simple API for sending OTP codes via WhatsApp using whatsapp-web.js',
            contact: {
                name: 'API Support',
                email: 'support@example.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Development server'
            }
        ],
        components: {
            schemas: {
                SendOTPRequest: {
                    type: 'object',
                    required: ['recipient', 'otp'],
                    properties: {
                        recipient: {
                            type: 'string',
                            description: 'Phone number with country code or WhatsApp ID',
                            example: '1234567890'
                        },
                        otp: {
                            type: 'string',
                            description: 'OTP code to send',
                            example: '123456'
                        }
                    }
                },
                SuccessResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        message: {
                            type: 'string',
                            example: 'OTP sent successfully'
                        },
                        data: {
                            type: 'object',
                            properties: {
                                recipient: {
                                    type: 'string',
                                    example: '1234567890@c.us'
                                },
                                messageId: {
                                    type: 'string',
                                    example: '3EB0C767D26B8C4C4A'
                                },
                                timestamp: {
                                    type: 'string',
                                    format: 'date-time',
                                    example: '2024-01-01T12:00:00.000Z'
                                }
                            }
                        }
                    }
                },
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        message: {
                            type: 'string',
                            example: 'Error description'
                        },
                        error: {
                            type: 'string',
                            example: 'Detailed error message'
                        }
                    }
                },
                StatusResponse: {
                    type: 'object',
                    properties: {
                        status: {
                            type: 'string',
                            enum: ['ready', 'not ready'],
                            example: 'ready'
                        },
                        message: {
                            type: 'string',
                            example: 'WhatsApp client is ready to send messages'
                        }
                    }
                },
                ApiInfoResponse: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            example: 'WhatsApp OTP API is running'
                        },
                        status: {
                            type: 'string',
                            enum: ['ready', 'not ready'],
                            example: 'ready'
                        },
                        endpoints: {
                            type: 'object',
                            properties: {
                                sendOTP: {
                                    type: 'string',
                                    example: 'POST /send-otp'
                                },
                                status: {
                                    type: 'string',
                                    example: 'GET /status'
                                },
                                docs: {
                                    type: 'string',
                                    example: 'GET /api-docs'
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./index.js']
});

/**
 * Generate Swagger specification
 * @param {number} port - Server port
 * @returns {Object} Swagger specification object
 */
const generateSwaggerSpec = (port) => {
    const options = createSwaggerOptions(port);
    return swaggerJsdoc(options);
};

module.exports = {
    createSwaggerOptions,
    generateSwaggerSpec
};
