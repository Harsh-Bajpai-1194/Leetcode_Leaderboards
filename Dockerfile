# Start with a base image that has Node.js
FROM node:18-bullseye

# Install Python, pip, Xvfb, xauth, and dumb-init (CRITICAL for xvfb-run in Docker)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    xvfb \
    xauth \
    dumb-init \
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

# Use dumb-init to manage the xvfb processes correctly
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Start server normally (server.js triggers xvfb-run dynamically)
CMD ["node", "server.js"]