# VPS Deployment — Multi-Tenant Subdomains

This guide explains how to deploy Akademee on a VPS so each school gets its own subdomain, e.g. **`dreamsuccess.akademee.com`** while the main platform lives at **`akademee.com`**.

All URLs must come from environment variables — never hardcode domains in HTML/JS.

---

## Architecture overview

```
                    ┌─────────────────────────────────────┐
                    │           DNS (Cloudflare/etc.)      │
                    │  *.akademee.com  →  VPS IP          │
                    │  akademee.com    →  VPS IP          │
                    │  api.akademee.com → VPS IP (optional)│
                    └─────────────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │              Nginx (reverse proxy)       │
                    │  • Static frontend (school subdomains)   │
                    │  • /api/* → Node backend :5000           │
                    └───────────────────┬───────────────────┘
                                        │
              ┌─────────────────────────┴─────────────────────────┐
              │  Node.js API (backend/)          PostgreSQL/Supabase │
              │  Cloudinary (media uploads)      SMTP (verification)   │
              └───────────────────────────────────────────────────────┘
```

Each school admin accesses:
- **Landing page:** `https://dreamsuccess.akademee.com/pages/akademee_vitrine_modern.html`
- **Dashboard:** `https://dreamsuccess.akademee.com/pages/akademee_layout.html`
- **Onboarding:** `https://dreamsuccess.akademee.com/pages/akademee_onboarding_v2.html`

---

## Step 1 — DNS records

At your domain registrar (or Cloudflare), add:

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| A | `@` | `<VPS_IP>` | Main domain `akademee.com` |
| A | `*` | `<VPS_IP>` | Wildcard — all school subdomains |
| A | `api` | `<VPS_IP>` | Optional dedicated API host |

Wait for propagation (usually 5–30 minutes).

---

## Step 2 — Backend environment (`.env`)

Copy `backend/.env.example` to `backend/.env`:

```env
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL=postgresql://...
DATABASE_SSL=true

# JWT
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d

# Cloudinary (required for logo/hero/gallery uploads)
CLOUDINARY_CLOUD_NAME=your_cloud
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret

# Email verification
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@akademee.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM=noreply@akademee.com

# ── URLs (all links derive from these) ──
API_BASE_URL=https://api.akademee.com
FRONTEND_URL=https://akademee.com
FRONTEND_URL_PRODUCTION=https://akademee.com
FRONTEND_PORT=443

# Multi-tenant subdomain domain
TENANT_DEV_DOMAIN=lvh.me
TENANT_PROD_DOMAIN=akademee.com
```

**Important:** `TENANT_PROD_DOMAIN=akademee.com` makes the backend build URLs like `https://dreamsuccess.akademee.com/...`.

If API and frontend share one Nginx host, you can set:

```env
API_BASE_URL=https://akademee.com
```

The frontend loads this via `GET /api/config/domains`.

---

## Step 3 — Install and run backend

```bash
cd /var/www/akademee/backend
npm ci --production
npm run migrate
node src/server.js
```

Use **PM2** for process management:

```bash
npm install -g pm2
pm2 start src/server.js --name akademee-api
pm2 save
pm2 startup
```

---

## Step 4 — Deploy frontend static files

Copy `akademee_design_frontend/` to your web root:

```bash
mkdir -p /var/www/akademee/frontend
cp -r akademee_design_frontend/* /var/www/akademee/frontend/
```

The frontend has no build step — it is static HTML/JS. It reads `API_BASE_URL` from the backend config endpoint at runtime.

---

## Step 5 — Nginx configuration

Create `/etc/nginx/sites-available/akademee`:

```nginx
# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name akademee.com *.akademee.com;
    return 301 https://$host$request_uri;
}

# Main + wildcard subdomains (frontend + API proxy)
server {
    listen 443 ssl http2;
    server_name akademee.com *.akademee.com;

    ssl_certificate     /etc/letsencrypt/live/akademee.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/akademee.com/privkey.pem;

    root /var/www/akademee/frontend;
    index akademee_register_v2.html;

    # API requests → Node backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 10M;
    }

    location /health {
        proxy_pass http://127.0.0.1:5000;
    }

    # Static frontend
    location / {
        try_files $uri $uri/ =404;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/akademee /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Optional: separate API subdomain

If `API_BASE_URL=https://api.akademee.com`:

```nginx
server {
    listen 443 ssl http2;
    server_name api.akademee.com;

    ssl_certificate     /etc/letsencrypt/live/akademee.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/akademee.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Update CORS in `backend/src/config/cors.js` to allow `https://*.akademee.com`.

---

## Step 6 — SSL certificate (Let's Encrypt)

Wildcard certificates require DNS validation:

```bash
sudo certbot certonly --manual --preferred-challenges dns \
  -d akademee.com -d "*.akademee.com"
```

Follow prompts to add the TXT record. Alternatively use Cloudflare Origin certificates if proxied through Cloudflare.

---

## Step 7 — Verify subdomain routing

1. Register a school at `https://akademee.com/akademee_register_v2.html`
2. Choose subdomain `dreamsuccess`
3. After verification, open `https://dreamsuccess.akademee.com/pages/akademee_onboarding_v2.html`
4. Confirm `GET /api/config/domains` returns `"domainSuffix": ".akademee.com"`
5. Publish website → landing page loads with school data from `GET /api/website/public?subdomain=dreamsuccess`

---

## Environment variable reference

| Variable | Example | Used for |
|----------|---------|----------|
| `TENANT_PROD_DOMAIN` | `akademee.com` | `{school}.akademee.com` hostnames |
| `API_BASE_URL` | `https://api.akademee.com` | All frontend fetch calls |
| `FRONTEND_URL` | `https://akademee.com` | Email links, redirects |
| `FRONTEND_URL_PRODUCTION` | `https://akademee.com` | Production frontend base |
| `CLOUDINARY_*` | — | Media uploads (onboarding gallery) |
| `SMTP_*` | — | School email verification |

---

## Local development (subdomain simulation)

Use `lvh.me` wildcard (resolves to 127.0.0.1):

```
http://dreamsuccess.lvh.me:3000/pages/akademee_onboarding_v2.html
```

Serve frontend on port 3000, backend on port 5000:

```env
NODE_ENV=development
API_BASE_URL=http://localhost:5000
TENANT_DEV_DOMAIN=lvh.me
FRONTEND_PORT=3000
```

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Gallery upload fails | Set `CLOUDINARY_*` in backend `.env` |
| Landing page shows mock data | Open via school subdomain; check `/api/website/public?subdomain=` |
| CORS errors | Add frontend origin to `backend/src/config/cors.js` |
| Login works but wrong school | Ensure `X-School-Subdomain` header matches logged-in school |
| Logout goes to login instead of landing | Frontend resolves `websiteUrl` from public API (fixed in `akademee-config.js`) |

---

## Quick test URLs after deploy

Replace `dreamsuccess` with your school subdomain:

- Landing: `https://dreamsuccess.akademee.com/pages/akademee_vitrine_modern.html`
- Dashboard: `https://dreamsuccess.akademee.com/pages/akademee_layout.html`
- API config: `https://akademee.com/api/config/domains`
- Public data: `https://akademee.com/api/website/public?subdomain=dreamsuccess`
