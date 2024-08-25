FROM --platform=linux/amd64 node:20-bookworm

RUN npx -y playwright@1.46.0 install --with-deps chromium

WORKDIR /app
COPY package*.json .

RUN npm ci --only=production --no-install-recommends

RUN apt-get update && apt-get install -y curl

COPY . .