# WhatsApp OTP API

A simple Express.js API for sending OTP codes via WhatsApp using whatsapp-web.js.

## Project Structure

```
whatsapp/
├── config/
│   └── swagger.js          # Swagger configuration and schemas
├── index.js                # Main server file
├── package.json            # Dependencies and scripts
├── Dockerfile              # Docker container configuration
├── docker-compose.yml      # Docker Compose configuration
├── .dockerignore           # Docker ignore file
├── nginx.conf              # Nginx reverse proxy configuration
└── README.md              # Documentation
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

## Docker Setup

### Quick Start with Docker Compose

1. **Build and run the application**:
```bash
docker-compose up --build
```

2. **Run in background**:
```bash
docker-compose up -d --build
```

3. **Stop the application**:
```bash
docker-compose down
```

### Docker Commands

**Build the Docker image**:
```bash
docker build -t whatsapp-otp-api .
```

**Run the container**:
```bash
docker run -p 3000:3000 \
  -v whatsapp-session:/app/.wwebjs_auth \
  -v whatsapp-cache:/app/.wwebjs_cache \
  whatsapp-otp-api
```

**Run with environment variables**:
```bash
docker run -p 3000:3000 \
  -e SOCKS5_HOST=127.0.0.1 \
  -e SOCKS5_PORT=1080 \
  -v whatsapp-session:/app/.wwebjs_auth \
  -v whatsapp-cache:/app/.wwebjs_cache \
  whatsapp-otp-api
```

### Docker Compose with Nginx

**Run with reverse proxy**:
```bash
docker-compose --profile with-nginx up --build
```

This will start both the WhatsApp API and Nginx reverse proxy.

## Usage

### 1. Initial Setup
When you first run the server, you'll see a QR code in the terminal. Scan this QR code with your WhatsApp mobile app to authenticate.

### 2. API Documentation
Visit `http://localhost:3000/api-docs` to view the interactive Swagger documentation.

### 3. API Endpoints

#### API Information
```bash
GET http://localhost:3000/
```

#### Check Status
```bash
GET http://localhost:3000/status
```

#### Send OTP
```bash
POST http://localhost:3000/send-otp
Content-Type: application/json

{
  "recipient": "1234567890",
  "otp": "123456"
}
```

**Recipient format:**
- Phone number with country code (e.g., "1234567890")
- Full WhatsApp ID (e.g., "1234567890@c.us")

**Example with curl:**
```bash
curl -X POST http://localhost:3000/send-otp \
  -H "Content-Type: application/json" \
  -d '{"recipient": "1234567890", "otp": "123456"}'
```

## Response Format

**Success:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "data": {
    "recipient": "1234567890@c.us",
    "messageId": "3EB0C767D26B8C4C4A",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Swagger Documentation

The API includes comprehensive Swagger/OpenAPI documentation:

- **Interactive Documentation**: Visit `http://localhost:3000/api-docs`
- **API Schema**: Complete request/response schemas
- **Examples**: Multiple examples for each endpoint
- **Try it out**: Test endpoints directly from the documentation

## Docker Features

- **Multi-stage build**: Optimized Docker image with minimal dependencies
- **Health checks**: Built-in health monitoring for container orchestration
- **Volume persistence**: WhatsApp session data and cache persist between container restarts
- **Environment variables**: Easy configuration via environment variables
- **Reverse proxy**: Optional Nginx configuration for production deployments
- **Security**: Non-root user and security headers included
- **Puppeteer optimization**: Uses system Chromium instead of downloading, avoiding 403 errors
- **Auto-reconnection**: Automatically reconnects on disconnection with exponential backoff
- **Error handling**: Comprehensive error handling and retry mechanisms
- **Stability**: Enhanced Chrome arguments for better container stability

## Notes

- The WhatsApp session is saved locally, so you only need to scan the QR code once
- Make sure the recipient number includes the country code
- The API automatically formats phone numbers to WhatsApp format
- Server runs on port 3000 by default (configurable via PORT environment variable)
- Swagger documentation is available at `/api-docs` endpoint
- Docker containers include all necessary system dependencies for WhatsApp Web
- Session data and cache are persisted using Docker volumes
- Both `.wwebjs_auth` and `.wwebjs_cache` directories are mounted as persistent volumes
