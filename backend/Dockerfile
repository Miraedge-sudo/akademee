FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS runner
WORKDIR /app
# Chromium is required by puppeteer-core for server-side report card PDF rendering.
RUN apk add --no-cache tzdata chromium nss freetype harfbuzz ca-certificates \
    ttf-freefont \
    font-noto \
    font-noto-cjk
ENV NODE_ENV=production
ENV TZ=UTC
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY --from=deps /app/node_modules ./node_modules
COPY . .

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "src/server.js"]
