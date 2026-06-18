# Akademee API Reference

Base URL comes from your environment — set `API_BASE_URL` in backend `.env` and load it on the frontend via `GET /api/config/domains`.

All tenant-scoped routes require:

```
Authorization: Bearer <jwt>
X-School-Subdomain: <school-subdomain>
Content-Type: application/json
```

---

## Config (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config/domains` | Domain suffix, API URL, template page map |
| GET | `/api/config/tenant` | Active tenant domain info |

**Example response** (`/api/config/domains`):

```json
{
  "success": true,
  "data": {
    "apiBaseUrl": "https://api.akademee.com",
    "domainSuffix": ".akademee.com",
    "protocol": "https",
    "tenantDomain": "akademee.com",
    "templatePages": {
      "modern": "akademee_vitrine_modern.html",
      "classic": "akademee_vitrine_classic.html",
      "minimal": "akademee_vitrine_minimal.html"
    }
  }
}
```

---

## Auth

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | Public | Login with `{ subdomain, email, password }` |
| POST | `/api/auth/logout` | JWT | End session (client clears localStorage) |
| GET | `/api/auth/me` | JWT | Current user + school |
| POST | `/api/auth/verify-school` | Public | Check subdomain exists |

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "subdomain": "dreamsuccess",
  "email": "admin@school.com",
  "password": "secret"
}
```

**Response:** `{ token, user, urls: { dashboardUrl, websiteUrl, loginUrl, ... } }`

---

## School registration & onboarding

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/schools/register` | Public | Register new school + admin |
| POST | `/api/schools/check-subdomain` | Public | `{ subdomain }` availability |
| GET | `/api/schools/plans` | Public | Subscription plans |
| GET | `/api/schools/templates` | Public | Website templates |
| GET | `/api/schools/verify-email?token=` | Public | Verify school email |
| GET | `/api/schools/onboarding` | Admin JWT | Load onboarding data |
| PUT | `/api/schools/onboarding` | Admin JWT | Save / publish onboarding |
| POST | `/api/schools/onboarding/media` | Admin JWT | Upload logo, hero, gallery |
| POST | `/api/schools/resend-verification` | Admin JWT | Resend verification email |

### Save onboarding (CRUD — Update)

```http
PUT /api/schools/onboarding
Authorization: Bearer <token>
X-School-Subdomain: dreamsuccess

{
  "schoolName": "Dream Success Academy",
  "tagline": "Excellence in education",
  "city": "Douala",
  "region": "Littoral",
  "address": "123 School Street",
  "phone": "+237 6XX XXX XXX",
  "email": "info@dreamsuccess.com",
  "yearFounded": "2010",
  "primaryColor": "#085041",
  "templateCode": "classic",
  "websiteDescription": "About our school...",
  "websiteStats": {
    "studentsEnrolled": "300",
    "qualifiedTeachers": "25",
    "gcePassRate": "92",
    "yearsOfOperation": "15"
  },
  "websiteValues": [
    { "name": "Excellence", "description": "High standards" }
  ],
  "onboardingCompleted": true,
  "websitePublished": true
}
```

### Upload media

```http
POST /api/schools/onboarding/media
Authorization: Bearer <token>
X-School-Subdomain: dreamsuccess
Content-Type: multipart/form-data

file: <image>
mediaType: logo | hero | gallery
sortOrder: 0   (optional, gallery slot index)
```

Requires Cloudinary env vars: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

---

## Public website (landing page)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/website/public?subdomain=` | Public | Full vitrine data for subdomain |

```http
GET /api/website/public?subdomain=dreamsuccess
X-School-Subdomain: dreamsuccess
```

Returns: name, tagline, colors, stats, values, gallery, template, urls.

---

## Students (tenant-scoped)

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/students` | admin, teacher, accountant | List (`?limit=&page=&search=`) |
| GET | `/api/students/:id` | admin, teacher, accountant | Get one |
| POST | `/api/students` | admin, teacher | Create |
| PUT | `/api/students/:id` | admin, teacher | Update |
| DELETE | `/api/students/:id` | admin | Delete |

### Create student

```http
POST /api/students
Authorization: Bearer <token>
X-School-Subdomain: dreamsuccess

{
  "firstName": "Jean",
  "lastName": "Mbarga",
  "className": "Form 3A",
  "studentNumber": "DSA-2026-001",
  "dateOfBirth": "2010-05-15",
  "gender": "male",
  "feeStatus": "paid"
}
```

---

## Guardians

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/guardians` | admin, teacher | List |
| GET | `/api/guardians/:id` | admin, teacher | Get one |
| GET | `/api/guardians/student/:studentId` | admin, teacher | By student |
| POST | `/api/guardians` | admin, teacher | Create |
| PUT | `/api/guardians/:id` | admin, teacher | Update |
| DELETE | `/api/guardians/:id` | admin | Delete |

```json
{
  "studentId": "<uuid>",
  "firstName": "Marie",
  "lastName": "Mbarga",
  "phone": "+237...",
  "email": "marie@email.com",
  "relationship": "mother"
}
```

---

## Classes

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/classes` | JWT | List school classes |
| GET | `/api/classes/:id` | JWT | Get class |
| POST | `/api/classes` | admin | Create |
| PUT | `/api/classes/:id` | admin | Update |
| DELETE | `/api/classes/:id` | admin | Delete |

---

## Academic years

| Method | Endpoint | Roles | Description |
|--------|----------|-------|-------------|
| GET | `/api/academics/years` | JWT | List years |
| POST | `/api/academics/years` | admin | Create |
| POST | `/api/academics/years/:id/set-active` | admin | Set active year |
| DELETE | `/api/academics/years/:id` | admin | Delete |

---

## Grades, attendance, finance, reports

See route files under `backend/src/routes/` for full list. All require JWT + tenant headers.

| Module | Base path |
|--------|-----------|
| Grades | `/api/grades` |
| Attendance | `/api/attendance` |
| Fees | `/api/finance` |
| Payments | `/api/payments` |
| Reports | `/api/reports` |
| Notifications | `/api/notifications` |
| Users profile | `/api/users/profile` |

---

## Health

```
GET /health
```

---

## Error format

```json
{
  "success": false,
  "message": "Human-readable error",
  "data": null
}
```

## Frontend integration checklist

1. Load `GET /api/config/domains` at startup — never hardcode URLs.
2. Pass `X-School-Subdomain` on every authenticated request.
3. Store JWT in `localStorage`; use URL hash to transfer session across subdomains after registration.
4. Map `template.code` from public API to the correct vitrine page.
5. Apply `primaryColor` to CSS variables (`--teal-900`, `--sc`, `--gold`) in dashboard and vitrine.
