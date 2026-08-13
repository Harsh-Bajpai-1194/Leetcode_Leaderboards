# Start with a base image that has Node.js
FROM node:18-bullseye

# Install Python and pip
RUN apt-get update && apt-get install -y python3 python3-pip

# Create an app directory
WORKDIR /app

# Copy your package.json and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy your Python requirements and install them
COPY requirements.txt ./
RUN pip3 install -r requirements.txt

# Install Playwright browsers (CRITICAL for your scraper)
RUN playwright install chromium
RUN playwright install-deps

# Copy the rest of your app's code
COPY . .

# Expose your port
EXPOSE 10000

# Start your Node server
CMD ["node", "server.js"]