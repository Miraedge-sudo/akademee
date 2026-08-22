# Super Admin Dashboard — Backend API Reference

Design + endpoint specification for a new platform-level Super Admin panel. **Nothing in this document exists yet** — there is currently no platform-admin concept anywhere in the codebase; every `ADMIN` role today is scoped to a single school (self-registration grants it). This doc specifies what needs to be built.

Grounded in the actual schema: `schools`, `subscription_plans`, `subscription_payments`, `website_templates`, `audit_logs` all already exist and are reused directly below.

## Base URL
```
http://localhost:5000
```
All routes in this doc are new, under a dedicated prefix: `/api/platform/*` — kept structurally separate from tenant routes (`/api/schools`, `/api/users`, …) so a school-scoped JWT can never be mistaken for a platform-admin JWT. See [Architecture](#architecture) for why this matters.

---

## Contents
1. [Architecture](#architecture)
2. [New database tables](#new-database-tables)
3. [Auth](#0-auth)
4. [Overview / Analytics](#1-overview--analytics)
5. [Schools](#2-schools)
6. [Subscription Plans](#3-subscription-plans)
7. [Billing & Payments](#4-billing--payments)
8. [Website Templates](#5-website-templates)
9. [Platform Team](#6-platform-team)
10. [Audit Log](#7-audit-log)
11. [Support Tools](#8-support-tools)
12. [Full endpoint index](#full-endpoint-index)

---

## Architecture

**Separate auth namespace, not a role on the existing `users` table.** A platform admin manages every school — they must never be representable as a row in a school-scoped `users` table, and a platform-admin JWT must never be structurally interchangeable with a tenant-user JWT.

- New table `platform_admins`, completely independent of `users`/`schools`.
- New JWT signing secret `PLATFORM_JWT_SECRET` (distinct from the tenant `JWT_SECRET`) — a token signed for one namespace fails verification outright in the other, not just a claims check. Belt-and-suspenders: also carry an explicit `"aud": "platform"` claim and verify it.
- New middleware `platformAuthMiddleware` (verifies against `PLATFORM_JWT_SECRET`, attaches `req.platformAdmin`) + `platformRoleMiddleware(['super_admin'])` (mirrors the existing `roleMiddleware` pattern in `backend/src/middleware/role.middleware.js`).
- Existing `tenantMiddleware`/`authMiddleware` are never applied to `/api/platform/*` routes, and vice versa.

**Roles within the platform namespace** (`platform_admins.role`):
| Role | Can do |
|---|---|
| `super_admin` | Everything, including managing other platform admins |
| `support` | Schools (read/suspend/reactivate), Support Tools (incl. impersonation), Audit Log (read) |
| `billing_ops` | Billing & Payments (full), Subscription Plans (full), Schools (read-only) |

---

## New database tables

### `platform_admins`
```sql
CREATE TABLE platform_admins (
  admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'support', 'billing_ops')),
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### `impersonation_sessions`
Tracks every support impersonation for audit + forced-revocation. See [Support Tools](#8-support-tools) for the flow this backs.
```sql
CREATE TABLE impersonation_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_admin_id UUID NOT NULL REFERENCES platform_admins(admin_id),
  school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  exchange_code_hash TEXT NOT NULL,
  exchange_code_expires_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  ended_reason VARCHAR(20) CHECK (ended_reason IN ('logout', 'expired', 'revoked')),
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_impersonation_platform_admin ON impersonation_sessions(platform_admin_id);
CREATE INDEX idx_impersonation_school ON impersonation_sessions(school_id);
```

### `audit_logs` — extend
The existing table (`backend/src/database/migrations/007_create_attachments_attendance_notifications.js`) has `school_id`/`user_id` but no way to record a *platform* actor. Add one nullable column rather than overloading `user_id`:
```sql
ALTER TABLE audit_logs ADD COLUMN platform_admin_id UUID REFERENCES platform_admins(admin_id);
CREATE INDEX idx_audit_logs_platform_admin ON audit_logs(platform_admin_id);
```
Every platform-admin action documented below writes an `audit_logs` row with `platform_admin_id` set and `school_id`/`user_id` set to whatever it acted on.

---

## 0. Auth

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/api/platform/auth/login` | — | `{ email, password }` → `{ token, refreshToken, admin }` |
| POST | `/api/platform/auth/refresh` | — | Rotate access token via httpOnly refresh cookie (same pattern as tenant auth) |
| POST | `/api/platform/auth/logout` | any | Invalidate refresh token |
| GET | `/api/platform/auth/me` | any | Current platform admin's profile |

Login attempts should be rate-limited (`express-rate-limit`, matching the existing pattern in `school.routes.js`) — platform-admin accounts are a higher-value target than a single school's login.

---

## 1. Overview / Analytics

Read-only. The dashboard's landing page.

| Method | Path | Role | Description | Chart |
|---|---|---|---|---|
| GET | `/api/platform/analytics/overview` | any | `{ totalSchools, activeSchools, trialSchools, suspendedSchools, mrr, mrrGrowthPct, newSchoolsThisMonth }` | Stat tiles |
| GET | `/api/platform/analytics/signups?period=30d\|12m` | any | Time series `[{ date, count }]` | Line |
| GET | `/api/platform/analytics/revenue?period=30d\|12m` | any | Time series `[{ date, amount }]` from `subscription_payments` | Area |
| GET | `/api/platform/analytics/plan-distribution` | any | `[{ planCode, count }]` | Donut |
| GET | `/api/platform/analytics/schools-by-region` | any | `[{ region, count }]` | Bar |
| GET | `/api/platform/analytics/conversion-rate` | any | Trial → paid conversion % over trailing 90 days | Stat tile + sparkline |

---

## 2. Schools

Read-heavy management of the tenant registry. **No manual creation** — schools only ever originate via self-registration (`POST /api/schools/register`); this section only manages schools that already exist.

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/platform/schools?search=&status=&plan=&region=&page=&limit=` | any | Paginated list |
| GET | `/api/platform/schools/:schoolId` | any | Detail: school record + `{ studentCount, userCount, lastActivityAt }` |
| GET | `/api/platform/schools/:schoolId/activity` | any | Recent `audit_logs` rows for this school |
| PATCH | `/api/platform/schools/:schoolId` | `super_admin`, `billing_ops` | Edit contact info / plan |
| PATCH | `/api/platform/schools/:schoolId/suspend` | `super_admin`, `support` | Sets `is_active = false`; logged |
| PATCH | `/api/platform/schools/:schoolId/reactivate` | `super_admin`, `support` | Sets `is_active = true`; logged |
| DELETE | `/api/platform/schools/:schoolId` | `super_admin` | **Soft** delete only (`is_active = false`, `deleted_at = now()`) — schools carry students/grades/payments; never a hard `DELETE FROM schools` |
| GET | `/api/platform/analytics/schools/student-distribution` | any | `[{ bucket, count }]` bucketed student counts — Bar chart |
| GET | `/api/platform/analytics/schools/status-breakdown` | any | `[{ status, count }]` — Donut chart |

Every `PATCH`/`DELETE` writes an `audit_logs` row (`platform_admin_id` set, `action` e.g. `SCHOOL_SUSPENDED`).

---

## 3. Subscription Plans

Full CRUD over the existing `subscription_plans` table.

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/platform/plans` | any | List all plans (incl. inactive) |
| GET | `/api/platform/plans/:planId` | any | Detail |
| POST | `/api/platform/plans` | `super_admin`, `billing_ops` | Create a new plan tier |
| PATCH | `/api/platform/plans/:planId` | `super_admin`, `billing_ops` | Edit price/features/max_students |
| DELETE | `/api/platform/plans/:planId` | `super_admin` | **Archive** (`is_active = false`) — never hard-delete; schools reference plans by `code` |
| GET | `/api/platform/analytics/plans/adoption` | any | `[{ planCode, schoolCount }]` — Bar chart |
| GET | `/api/platform/analytics/plans/revenue` | any | `[{ planCode, revenue }]` — Bar chart |

---

## 4. Billing & Payments

Reads/manages `subscription_payments` (the existing Fapshi transaction ledger, `backend/src/database/migrations/048_create_subscription_payments.js`).

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/platform/payments?status=&schoolId=&from=&to=&page=&limit=` | `super_admin`, `billing_ops` | Paginated transaction list |
| GET | `/api/platform/payments/:paymentId` | `super_admin`, `billing_ops` | Detail, incl. `raw_webhook` payload |
| PATCH | `/api/platform/payments/:paymentId/status` | `super_admin`, `billing_ops` | Mark `refunded`/`disputed`/`resolved` — **never** re-triggers a real Fapshi transaction, purely a bookkeeping annotation on the record |
| GET | `/api/platform/analytics/revenue-timeseries?period=` | `super_admin`, `billing_ops` | `[{ date, amount }]` — Area chart |
| GET | `/api/platform/analytics/payment-status-breakdown` | `super_admin`, `billing_ops` | `[{ status, count }]` — Donut |
| GET | `/api/platform/analytics/revenue-by-plan` | `super_admin`, `billing_ops` | `[{ planCode, amount }]` — Stacked bar |

---

## 5. Website Templates

Full CRUD over the existing `website_templates` table (the catalog schools pick their public site design from).

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/platform/templates` | any | List all templates |
| GET | `/api/platform/templates/:templateId` | any | Detail |
| POST | `/api/platform/templates` | `super_admin` | Add a new template (`template_code`, `name`, `description`, `preview_url`) |
| PATCH | `/api/platform/templates/:templateId` | `super_admin` | Edit |
| DELETE | `/api/platform/templates/:templateId` | `super_admin` | Only if zero schools reference it (`website_template_id`); otherwise reject with a clear error, don't orphan schools |
| GET | `/api/platform/analytics/templates/popularity` | any | `[{ templateCode, schoolCount }]` — Bar chart |

---

## 6. Platform Team

Full CRUD over `platform_admins` itself — `super_admin` only, since this controls who can control everything else.

| Method | Path | Role | Description |
|---|---|---|---|
| GET | `/api/platform/team` | `super_admin` | List all platform admins |
| GET | `/api/platform/team/:adminId` | `super_admin` | Detail |
| POST | `/api/platform/team` | `super_admin` | Invite a new platform admin (email invite + set-password flow, same shape as the existing `invite.routes.js` pattern) |
| PATCH | `/api/platform/team/:adminId` | `super_admin` | Edit name/role |
| PATCH | `/api/platform/team/:adminId/deactivate` | `super_admin` | Revoke access without deleting the record |
| DELETE | `/api/platform/team/:adminId` | `super_admin` | Only for accounts that were never active (invited, never accepted) — otherwise deactivate, to preserve the audit trail's `platform_admin_id` references |

No charts — this is a small operational list, not analytics.

---

## 7. Audit Log

Read-only view over `audit_logs`, now covering both tenant-side and platform-side actions.

| Method | Path | Role | Description | Chart |
|---|---|---|---|---|
| GET | `/api/platform/audit-logs?schoolId=&userId=&platformAdminId=&action=&from=&to=&page=&limit=` | any | Paginated, filterable | — |
| GET | `/api/platform/audit-logs/export?…same filters` | `super_admin` | CSV export of the filtered set | — |
| GET | `/api/platform/analytics/audit/activity-volume?period=` | any | `[{ date, count }]` | Line |
| GET | `/api/platform/analytics/audit/top-actions` | any | `[{ action, count }]` | Bar |

---

## 8. Support Tools

Actions, not CRUD.

| Method | Path | Role | Description |
|---|---|---|---|
| POST | `/api/platform/schools/:schoolId/resend-verification` | `super_admin`, `support` | Re-triggers the existing `resendVerificationEmail` service |
| POST | `/api/platform/system/refresh-all-statuses` | `super_admin` | Platform-wide equivalent of the existing tenant-scoped `PATCH /api/admin/refresh-period-statuses` |
| POST | `/api/platform/schools/:schoolId/impersonate` | `super_admin`, `support` | Start impersonating that school's admin — see flow below |
| POST | `/api/platform/impersonate/exchange` | — (public, code-gated) | `{ code }` → `{ token }`. Called by the frontend after redirect |
| POST | `/api/platform/impersonate/:sessionId/end` | any (own session) | Explicit end |

### Impersonation flow — deliberately not a raw JWT in the URL

This system's own login flow currently has a real vulnerability where a live JWT gets placed directly in a URL query string during cross-subdomain redirects (browser history, server logs, screenshots all expose it — see the security audit for this codebase). Impersonation must not repeat that mistake; it's a more sensitive case, not less.

1. `POST /api/platform/schools/:schoolId/impersonate` — resolves the school's `ADMIN` user, creates an `impersonation_sessions` row, generates a random opaque code, stores only its hash (`exchange_code_hash`) with a short expiry (60s), writes an `audit_logs` entry (`IMPERSONATION_START`). Returns `{ redirectUrl: "https://{subdomain}.akademee.com/dashboard?impersonation_code=..." }` — the *code*, never the session token itself.
2. Frontend redirects to that URL. The dashboard's boot sequence detects `impersonation_code`, calls `POST /api/platform/impersonate/exchange` with it.
3. That endpoint verifies the code against the stored hash, checks it hasn't expired or already been used, marks `started_at`, mints a normal short-lived tenant-scoped JWT for the target user with an added `impersonatedBy: platformAdminId` claim, and returns it. The code is single-use — verified and burned atomically.
4. Frontend stores the token exactly like a normal session, but the `impersonatedBy` claim lets the UI render a persistent "you are impersonating {school}" banner and lets the backend log every subsequent write made under that token as attributable to the impersonation.
5. `POST /api/platform/impersonate/:sessionId/end` (or natural token expiry) sets `ended_at`/`ended_reason`, writes `IMPERSONATION_END` to `audit_logs`.

A `super_admin` should additionally be able to force-end any active session (e.g. `PATCH /api/platform/impersonate/:sessionId/revoke`) — worth adding once the base flow is built.

---

## Full endpoint index

| Page | Endpoints |
|---|---|
| Auth | 4 |
| Overview / Analytics | 6 |
| Schools | 8 |
| Subscription Plans | 7 |
| Billing & Payments | 6 |
| Website Templates | 6 |
| Platform Team | 6 |
| Audit Log | 4 |
| Support Tools | 5 |
| **Total** | **52** |

---

## Implementation notes

- **Middleware**: `backend/src/middleware/platformAuth.middleware.js` (new) mirrors `auth.middleware.js` but verifies `PLATFORM_JWT_SECRET` and attaches `req.platformAdmin`. `backend/src/middleware/platformRole.middleware.js` (new) mirrors `role.middleware.js`.
- **Routes file**: `backend/src/routes/platform/*.routes.js`, mounted in `app.js` as `app.use('/api/platform', platformRouter)` — kept structurally separate from every existing `app.use('/api/...')` line so there's no accidental route overlap with tenant paths.
- **Migrations**: three new migration files for `platform_admins`, `impersonation_sessions`, and the `audit_logs.platform_admin_id` column — follow the existing numbered pattern in `backend/src/database/migrations/`.
- **Env vars**: `PLATFORM_JWT_SECRET` (new, required, fail-fast at boot like the existing `JWT_SECRET` check in `config/jwt.js`).
- **Rate limiting**: apply to `/api/platform/auth/login` at minimum, matching the existing `registerLimiter` pattern in `school.routes.js`.
