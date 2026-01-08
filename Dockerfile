FROM node:18

# Install Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-sandbox \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgdk-pixbuf2.0-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY puppeteer/scraper/package*.json ./scraper/
COPY puppeteer/web/package*.json ./web/

# Install dependencies
RUN cd scraper && npm install
RUN cd web && npm install

# Copy source code
COPY puppeteer/scraper ./scraper
COPY puppeteer/web ./web

# Expose port
EXPOSE 3000

# Start the web server
CMD ["npm", "start", "--prefix", "web"]
