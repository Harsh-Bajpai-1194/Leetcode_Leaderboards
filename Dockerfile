FROM node:18-bullseye

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY requirements.txt ./
RUN pip3 install -r requirements.txt

COPY . .

EXPOSE 10000

CMD ["node", "server.js"]