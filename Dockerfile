FROM node:20-bookworm

RUN npx -y playwright@1.42.1 install --with-deps chromium

WORKDIR /app
COPY package*.json .

RUN npm ci --only=production --no-install-recommends

COPY . .

CMD npm run start