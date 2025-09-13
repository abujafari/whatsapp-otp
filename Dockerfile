# Use Node.js 18 LTS as base image
FROM node:18-slim

# Install system dependencies required for Puppeteer and WhatsApp Web
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    procps \
    libxss1 \
    libgconf-2-4 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrender1 \
    libxtst6 \
    libnss3 \
    libxss1 \
    libgconf-2-4 \
    fonts-liberation \
    libappindicator1 \
    xdg-utils \
    curl \
    chromium \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Set environment variables to skip Puppeteer Chromium download
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create directories for WhatsApp session data and cache
RUN mkdir -p /app/.wwebjs_auth /app/.wwebjs_cache

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/status || exit 1

# Start the application
CMD ["npm", "start"]
