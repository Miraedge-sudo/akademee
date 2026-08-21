FROM node:20 AS builder
WORKDIR /app
# `npm run build` runs a post-build prerender step that needs a real
# Chromium. Installing Debian's own `chromium` package resolves its correct
# runtime deps automatically (guessing exact versioned lib package names for
# puppeteer's bundled binary is fragile across Debian releases) — puppeteer
# is then pointed at it instead of downloading/launching its own copy.
# This only affects the build stage, not the final nginx:alpine image below.
RUN apt-get update && apt-get install -y --no-install-recommends chromium \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --no-check-certificate --spider https://127.0.0.1:443/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
