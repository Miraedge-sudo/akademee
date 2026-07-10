# Akademee Backend — API Server

School management system backend built with **Express.js**, **PostgreSQL**, and **Node.js 20+**.

## Project Structure

```
backend/
├── src/
│   ├── config/                    # Configuration
│   │   ├── database.js            # PostgreSQL connection (postgres driver)
│   │   ├── env.js                 # Environment variable validation
│   │   ├── swagger.js             # OpenAPI 3.0 spec generator
│   │   ├── sentry.js              # Sentry error monitoring init
│   │   ├── cors.js                # CORS whitelist + tenant subdomain patterns
│   │   ├── jwt.js                 # JWT secret & expiry
│   │   ├── cloudinary.js          # Cloudinary image upload config
│   │   ├── multer.js              # Multer file upload config
│   │   └── domains.js             # Tenant domain configuration
│   │
│   ├── database/
│   │   └── migrations/            # 019 migrations (SQL schema)
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js     # JWT verification + blacklist check
│   │   ├── role.middleware.js     # RBAC role enforcement
│   │   ├── schoolResolver.middleware.js  # Subdomain → school lookup
│   │   ├── tenant.middleware.js   # Attach school_id to request
│   │   ├── validate.middleware.js # express-validator runner
│   │   ├── audit.middleware.js    # Action audit log writer
│   │   ├── requestId.middleware.js # UUID per request
│   │   ├── httpLogger.middleware.js # Morgan → Winston stream
│   │   ├── cache.middleware.js    # Response caching + invalidation
│   │   ├── rateLimiter.middleware.js # Standard / strict rate limiters
│   │   ├── error.middleware.js    # Typed error handler (AppError, Multer, JWT)
│   │   └── upload.middleware.js   # Multer upload handler
│   │
│   ├── controllers/               # 25 controllers (HTTP handlers)
│   ├── routes/                    # 30 route files (all endpoints)
│   ├── services/                  # 30 services (business logic)
│   ├── validators/                # 15 validator files (express-validator chains)
│   ├── utils/
│   │   ├── logger.js              # Winston logger (console + file transports)
│   │   ├── cache.js               # node-cache wrapper (TTL, prefix invalidation)
│   │   ├── AppError.js            # Typed error class with static factories
│   │   ├── response.js            # Standardized success/error/paginated responses
│   │   ├── constants.js           # Application constants
│   │   ├── domainHelper.js        # School URL builder
│   │   └── slugGenerator.js       # Subdomain slug generator
│   │
│   ├── app.js                     # Express app setup
│   └── server.js                  # Entry point with graceful shutdown
│
├── scripts/
│   ├── migrate.js                 # Migration runner
│   ├── seed.js                    # Database seeder
│   └── testConnection.js          # Connectivity test
│
├── Dockerfile                     # Production container
├── Dockerfile.dev                 # Dev container (nodemon)
├── .dockerignore
├── .eslintrc.json                 # ESLint config
├── package.json
└── README.md
```

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, JWT_SECRET, etc.

# Run migrations (all 019)
npm run migrate

# Seed initial data (roles, templates, plans)
npm run seed

# Start dev server
npm run dev
```

Server runs at `http://localhost:5000` — API docs at `http://localhost:5000/api-docs`.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Production server |
| `npm run dev` | Dev server with nodemon |
| `npm run migrate [num]` | Run migrations (all or specific) |
| `npm run seed` | Seed database |
| `npm test` | Run Jest tests |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |

## API Endpoints

Full interactive documentation at `/api-docs` when the server is running.

| Area | Base Path | Key Endpoints |
|------|-----------|---------------|
| Auth | `/api/auth` | `POST /login`, `POST /logout`, `GET /me`, `POST /forgot-password`, `POST /reset-password`, `POST /verify-school` |
| Schools | `/api/schools` | `POST /register`, `GET /onboarding`, `PUT /onboarding`, `POST /onboarding/media`, `GET /plans`, `GET /templates` |
| Website | `/api/website` | `GET /public/:subdomain`, `GET /data/:schoolId`, `POST /template/update` |
| Users | `/api/users` | `GET /profile`, `PUT /profile`, `PUT /change-password` |
| User Mgmt | `/api/users/manage` | Full CRUD for admin users |
| Students | `/api/students` | Full CRUD + list |
| Guardians | `/api/guardians` | CRUD + list by student |
| Academics | `/api/academics` | `GET/POST /years`, `PUT/DELETE /years/:id`, `POST /years/:id/activate`, `GET/POST /terms`, `PUT/DELETE /terms/:id`, `POST /terms/:id/set-active` |
| Classes | `/api/classes` | Full CRUD, `POST /:id/students`, `DELETE /:id/students/:studentId` |
| Subjects | `/api/subjects` | Full CRUD, `POST /:id/classes`, `POST /:id/teachers` |
| Grades | `/api/grades` | CRUD, `GET /student/:studentId`, `GET /class/:classId`, `GET /period/:periodId`, `POST /calculate`, `GET /report-card/:studentId`, `POST /bulk-upload` |
| Attendance | `/api/attendance` | `POST /record`, `GET /student/:studentId`, `GET /class/:classId`, `GET /statistics`, `POST /bulk` |
| Finance | `/api/finance` | `GET/POST /fees`, `PUT/DELETE /fees/:id`, `POST /fees/assign`, `GET /student/:studentId`, `GET /reports` |
| Payments | `/api/payments` | `POST /initiate`, `POST /confirm`, `GET /:id`, `GET /student/:studentId`, `GET /report` |
| Exams | `/api/exams` | CRUD, `POST /:id/register`, `GET /:id/registrations`, `PUT /:id/result` |
| Reports | `/api/reports` | `GET /bulletin/:studentId`, `GET /bulletin/:studentId/pdf`, `GET /class/:classId`, `GET /class/:classId/pdf`, `GET /performance`, `GET /export` |
| Notifications | `/api/notifications` | `GET /`, `GET /unread/count`, `POST /send`, `PUT /:id/read`, `DELETE /:id` |
| Announcements | `/api/announcements` | CRUD, `POST /:id/publish`, `POST /:id/unpublish` |
| Periods | `/api/periods` | CRUD (terms/semesters) |
| Enrollments | `/api/enrollments` | CRUD, `PUT /:id/transfer`, `GET /student/:studentId` |
| Dashboard | `/api/dashboard` | `GET /stats`, `GET /activities`, `GET /revenue` |
| Roles | `/api/roles` | List roles/permissions, assign/remove user roles |
| Audit | `/api/audit-logs` | `GET /` (paginated log viewer) |
| Config | `/api/config` | App configuration |
| API Docs | `/api-docs` | Swagger UI + `GET /spec.json` |

## Authentication & Authorization

### JWT Flow
1. `POST /api/auth/login` with `{ subdomain, email, password }`
2. Returns JWT token (configurable expiry, default 7d)
3. Client sends `Authorization: Bearer <token>` on all subsequent requests
4. Token blacklisted on logout — checked on every request via `token_blacklist` table

### Roles

| Role | Access |
|------|--------|
| SUPER_ADMIN | Full system access |
| ADMIN | School administration |
| TEACHER | Class & grade management |
| ACCOUNTANT | Financial operations |
| STUDENT | View own data |
| GUARDIAN | View child's data |
| STAFF | General functions |

Permissions enforced via `role.middleware.js` against the `role_permissions` / `permissions` tables (36 granular permission codes).

## Response Format

```json
{
  "success": true,
  "message": "...",
  "data": { ... },
  "reqId": "uuid"
}
```

Paginated responses include `total`, `limit`, `offset` alongside the data array.

Error responses include `reqId` for request tracing.

## Architecture

### Layered Pattern
- **Routes** — Define HTTP method + path, wire middleware chain
- **Validators** — express-validator chains for input validation
- **Controllers** — Extract params from request, delegate to service, format response
- **Services** — Business logic with tenant-scoped SQL queries
- **Middleware** — Cross-cutting concerns (auth, audit, cache, rate limit, error handling)

### Key Middleware (in order)
1. `helmet` — Security headers
2. `compression` — Gzip response compression
3. `cors` — Origin whitelist
4. `requestId` — UUID per request (`X-Request-Id`)
5. `httpLogger` — Morgan → Winston structured logging
6. `schoolResolver` — Subdomain → school lookup
7. `tenant` — Attach `school_id` / `req.tenantId`
8. Route-level: auth → role → validator → rate limiter → audit → controller

## Security

- **JWT authentication** — Stateless tokens with blacklist support
- **RBAC** — Role-based access with granular permission checks
- **Password hashing** — bcrypt (10 salt rounds)
- **Input validation** — All mutation endpoints validated via express-validator
- **SQL injection prevention** — Parameterized queries via `postgres` tagged template literals
- **CORS** — Strict origin whitelist with tenant subdomain patterns
- **Rate limiting** — Standard (30/15min) and strict (10/15min) limiters on all mutation routes
- **Audit logging** — Every POST/PUT/DELETE logged to `audit_logs` table
- **Error handling** — No stack traces in production; typed errors via `AppError` class
- **Helmet** — Secure HTTP headers

## Monitoring & Observability

| Tool | Purpose |
|------|---------|
| **Winston** | Structured logging (console in dev, JSON files in prod). Transports: `error.log`, `combined.log` with 5MB rotation |
| **Morgan** | HTTP request logging piped into Winston's `http` level |
| **Sentry** | Error tracking (enable by setting `SENTRY_DSN` in `.env`). Captures stack traces, user context, request breadcrumbs |
| **Request ID** | Every request gets a UUID — logged by Winston and Sentry, returned in all error responses |
| **Health check** | `GET /health` returns `{ status: "OK", timestamp }` — used by Docker HEALTHCHECK |

## Caching

In-memory cache via `node-cache` (max 5000 keys, default 5min TTL):

| Route Group | TTL |
|-------------|-----|
| `/api/config` | 10 min |
| `/api/website` | 5 min |
| `/api/reports`, `/api/audit-logs` | 5 min |
| `/api/dashboard` | 2 min |
| `/api/grades`, `/api/grade-calculations` | 2 min |
| `/api/attendance-stats`, `/api/fee-calculations` | 2 min |

Responses include `X-Cache: HIT|MISS` header. Cache invalidated automatically on mutation via `invalidateCache` middleware.

## Database

### PostgreSQL

Connection via the `postgres` driver (tagged template literals). SSL enabled in production via `DATABASE_SSL=true`.

### Key Tables (31 total)

| Table | Purpose |
|-------|---------|
| `schools` | Tenant organizations |
| `users` | User accounts (staff, teachers, students, guardians) |
| `students` | Student records (linked to users) |
| `guardians` | Parent/guardian relationships |
| `classes` | Class sections with capacity |
| `subjects` | Subjects with coefficient |
| `class_subjects` | Many-to-many class↔subject (compulsory flag, coefficient) |
| `subject_teachers` | Teacher assignments to subject+class |
| `periods` | Academic terms/semesters |
| `academic_years` | School years |
| `enrollments` | Student enrollment (supports transfers) |
| `grades` | Student scores per subject per period |
| `grade_scales` | Letter grade boundaries (francophone/anglophone systems) |
| `attendance` | Daily attendance records |
| `exams` | External exam definitions |
| `exam_registrations` | Student exam registration + results |
| `fees` | Fee structures |
| `student_fees` | Per-student fee assignments |
| `payments` | Payment transactions |
| `notifications` | In-app notifications |
| `announcements` | School-wide announcements |
| `audit_logs` | Action audit trail |
| `roles` / `permissions` / `role_permissions` | RBAC system |
| `website_templates` | Public website theme presets |

### Running Migrations

```bash
# Run all pending migrations
npm run migrate

# Run a specific migration
npm run migrate 019

# Reset database (drops all tables)
npm run migrate reset
```

## Docker

### Production

```bash
# Set required env vars
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "DB_PASSWORD=$(openssl rand -base64 16)" >> .env

# Start stack
docker compose up -d

# Run migrations
docker compose exec backend node scripts/migrate.js

# Seed data
docker compose exec backend node scripts/seed.js
```

Stack: `db` (postgres:16), `backend` (port 5000), `frontend` (port 80). Frontend nginx reverse-proxies `/api/` and `/api-docs` to backend.

### Development

```bash
docker compose -f docker-compose.dev.yml up -d
```

Hot-reload enabled via volume mounts + nodemon (backend) / vite dev server (frontend).

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`):

1. **Backend** — `npm ci` → `eslint` → `jest` (skips if no tests)
2. **Frontend** — `npm ci` → `eslint` → `vite build`
3. **Deploy** — On push to `main`, after lint+build pass (add your deploy logic)

## Troubleshooting

| Problem | Check |
|---------|-------|
| `Missing DATABASE_URL` | Ensure `.env` exists with valid Supabase/PostgreSQL connection string |
| CORS errors | Verify origin is in `cors.js` whitelist or is a valid tenant subdomain |
| `School not found` on login | Confirm subdomain exists in `schools` table and `is_active = true` |
| JWT expired | Token TTL is 7d by default — login again |
| `relation does not exist` | Run `npm run migrate` to apply all migrations |
| File upload fails | Check Cloudinary credentials and file size < 10MB |
| Sentry not reporting | `SENTRY_DSN` must be set in `.env` — empty DSN disables Sentry silently |
| Cache serving stale data | Cache TTL varies by route (2-10 min). Mutation handlers auto-invalidate |
| 429 Too Many Requests | Rate limited — standard 30 req/15min, strict 10 req/15min for mutations |
| Slow queries | Run migration 019 to add missing indexes. Check query plans via `EXPLAIN ANALYZE` |

## Docs

- **Swagger UI**: `GET /api-docs` (when server is running)
- **Raw spec**: `GET /api-docs/spec.json`
- `backend/src/config/swagger.js` — OpenAPI 3.0 definition with all schemas and path annotations

---

**Akademee Backend v1.0.0** | Node.js 20+ | Express.js | PostgreSQL
