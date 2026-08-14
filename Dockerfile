FROM node:18-bullseye

# Install Python, pip, and Xvfb (Virtual Screen for headless=False)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    xvfb \
    libnss3 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpango-1.0-0 \
    libcairo2

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY requirements.txt ./
RUN pip3 install -r requirements.txt

RUN playwright install chromium
RUN playwright install-deps

COPY . .

EXPOSE 10000

# Start server wrapped in xvfb-run so Playwright can use headless=False
CMD ["xvfb-run", "--server-args='-screen 0 1280x1024x24'", "node", "server.js"]