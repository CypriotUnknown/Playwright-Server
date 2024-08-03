FROM --platform=linux/amd64 node:20-bookworm

RUN npx -y playwright@1.45.3 install --with-deps chromium

WORKDIR /app
COPY package*.json .

RUN npm ci --only=production --no-install-recommends

COPY . .