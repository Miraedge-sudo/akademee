# Frontend Guide — What You Need to Build

## Frontend To-Do List

| # | Priority | Task | Notes |
|---|----------|------|-------|
| 1 | 🔴 High | Create `/signup` (or `/register`) page | Calls `POST /api/schools/register`. After success, store `token` from response, redirect to `/onboarding` |
| 2 | 🔴 High | Create `/login` page | Calls `POST /api/auth/login`, then call `GET /api/auth/me` to get full user profile |
| 3 | 🔴 High | Create `/onboarding` wizard | Multi-step form using `GET /api/schools/onboarding` to load, `PUT /api/schools/onboarding` to save |
| 4 | 🔴 High | Create `/educational-system-selection` page | After onboarding, lets admin pick which educational systems their school follows. Calls `PUT /api/schools/onboarding` with `{ educationalSystems: [...] }` |
| 5 | 🔴 High | Create `/dashboard` layout + pages | Student management, finance, academics etc. All scoped to the authenticated school |
| 6 | 🔴 High | Create `/site` (public school page) | Reads `GET /api/website/public?subdomain=xxx` and renders the school's public vitrine |
| 7 | 🔴 High | Create `/verify-email?token=` page | The email verification link routes here. Call `GET /api/schools/verify-email?token=XXX` on mount, show success/error |
| 8 | 🔴 High | Create `/forgot-password` page | Email + subdomain form. Calls `POST /api/auth/forgot-password`, shows "If this account exists, a link has been sent" |
| 9 | 🔴 High | Create `/reset-password?token=` page | Reads token from URL, shows new password form. Calls `POST /api/auth/reset-password` |
| 10 | 🟡 Medium | Add ranking section to onboarding | Fields: `ranking`, `rankingCity`, `examType`, `examPassRate` |
| 11 | 🟡 Medium | Add about photos to onboarding | Upload via `POST /api/schools/onboarding/media`, save URLs via `PUT /api/schools/onboarding` with `aboutPhotos` |
| 12 | 🟡 Medium | Add classes config to onboarding | Freeform JSON editor or structured UI via `classesConfig` field |
| 13 | 🟡 Medium | Add hero image 2 to onboarding | Upload secondary hero image, save via `heroImageUrl2` |
| 14 | 🟢 Low | Handle 429 rate-limit errors | Show friendly "Too many requests, try again in 15 minutes" message |

---

# API Reference — All Endpoints Ready to Consume

Base URL: `http://localhost:5000/api` (dev) or your production API URL.

All responses follow this envelope:

```json
{
  "success": true,
  "message": "Human-readable message",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": null
}
```

---

## 1. Auth Endpoints (`/api/auth/`)

### POST `/api/auth/login`

Authenticate a school admin.

```
Rate limit: 20 req / 15 min
Auth: none
```

**Request:**
```json
{
  "subdomain": "grace-academy",
  "email": "admin@graceacademy.cm",
  "password": "sekret123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@graceacademy.cm",
      "firstName": "John",
      "lastName": "Doe",
      "schoolId": "uuid",
      "subdomain": "grace-academy",
      "schoolName": "Grace Academy",
      "roles": ["ADMIN"]
    },
    "token": "eyJhbGci...",
    "urls": {
      "dashboardUrl": "http://grace-academy.lvh.me:3000/dashboard",
      "onboardingUrl": "http://grace-academy.lvh.me:3000/onboarding",
      "loginUrl": "http://grace-academy.lvh.me:3000/login",
      "websiteUrl": "http://grace-academy.lvh.me:3000/site",
      "verifyEmailUrl": "http://grace-academy.lvh.me:3000/verify-email"
    }
  }
}
```

**Frontend flow:** Store `data.token` in localStorage, then immediately call `GET /api/auth/me` to load the full user profile (which includes `school.educationalSystems`, `onboardingCompleted`, etc.).

---

### POST `/api/auth/logout`

```
Rate limit: none
Auth: Bearer token required
```

**Response:**
```json
{ "success": true, "message": "Logout successful", "data": {} }
```

**Frontend flow:** Clear localStorage token, redirect to `/login`.

---

### GET `/api/auth/me`

Get the authenticated user's full profile, including school data.

```
Rate limit: none
Auth: Bearer token required
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@graceacademy.cm",
    "firstName": "John",
    "lastName": "Doe",
    "schoolId": "uuid",
    "roles": ["ADMIN"],
    "school": {
      "school_id": "uuid",
      "name": "Grace Academy",
      "subdomain": "grace-academy",
      "email_verified": true,
      "onboarding_completed": true,
      "educational_systems": ["anglophone_general"],
      "educationalSystems": ["anglophone_general"],
      "primaryColor": "#085041",
      "logoUrl": "https://res.cloudinary.com/.../logo.png",
      "heroImageUrl": "https://res.cloudinary.com/.../hero.jpg",
      "heroImageUrl2": null,
      "tagline": "Shaping leaders",
      "city": "Douala",
      "region": "Littoral",
      "examType": null,
      "examPassRate": null,
      "ranking": null,
      "rankingCity": null,
      "aboutPhotos": [],
      "classesConfig": {}
    },
    "schoolName": "Grace Academy",
    "subdomain": "grace-academy",
    "emailVerified": true,
    "onboardingCompleted": true
  }
}
```

**Key frontend fields:**
- `data.onboardingCompleted` — gate redirect to onboarding
- `data.school.educationalSystems` — gate redirect to system selection page, filter sidebar nav
- `data.school.primaryColor` — set app theme color

---

### POST `/api/auth/verify-school`

Check if a school exists by subdomain (used on login page to validate before showing password field).

```
Rate limit: 30 req / 15 min
Auth: none
```

**Request:**
```json
{ "subdomain": "grace-academy" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "exists": true,
    "school_id": "uuid",
    "name": "Grace Academy",
    "subdomain": "grace-academy"
  }
}
```

---

### POST `/api/auth/forgot-password`

Send a password reset email.

```
Rate limit: 5 req / 15 min
Auth: none
```

**Request:**
```json
{
  "email": "admin@graceacademy.cm",
  "subdomain": "grace-academy"
}
```

**Response** (always same — does not reveal if email exists):
```json
{
  "success": true,
  "data": { "sent": true }
}
```

---

### POST `/api/auth/reset-password`

Reset password using token from email link.

```
Rate limit: 10 req / 15 min
Auth: none
```

**Request:**
```json
{
  "token": "abc123def456...",
  "password": "newSecurePassword123"
}
```

**Success:**
```json
{
  "success": true,
  "message": "Password reset successfully. You can now login with your new password.",
  "data": { "success": true }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Invalid or expired reset token"
}
```

---

## 2. School / Registration Endpoints (`/api/schools/`)

### POST `/api/schools/register`

Register a new school and its admin user.

```
Rate limit: 10 req / 15 min
Auth: none
```

**Request:**
```json
{
  "schoolName": "Grace Academy",
  "firstName": "John",
  "lastName": "Doe",
  "email": "admin@graceacademy.cm",
  "password": "sekret123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schoolId": "uuid",
    "schoolName": "Grace Academy",
    "subdomain": "grace-academy",
    "onboardingCompleted": false,
    "school": {
      "schoolId": "uuid",
      "schoolName": "Grace Academy",
      "subdomain": "grace-academy"
    },
    "urls": {
      "dashboardUrl": "http://grace-academy.lvh.me:3000/dashboard",
      "onboardingUrl": "http://grace-academy.lvh.me:3000/onboarding",
      "loginUrl": "http://grace-academy.lvh.me:3000/login",
      "websiteUrl": "http://grace-academy.lvh.me:3000/site"
    },
    "token": "eyJhbGci..."
  }
}
```

**Frontend flow:** Store token, redirect to `/onboarding`.

---

### POST `/api/schools/check-subdomain`

Check if a subdomain is available during registration.

```
Rate limit: none
Auth: none
```

**Request:**
```json
{ "subdomain": "grace-academy" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "available": true,
    "subdomain": "grace-academy"
  }
}
```

---

### GET `/api/schools/verify-email?token=XXX`

Verify school email via link from email.

```
Rate limit: none
Auth: none
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "alreadyVerified": false,
    "subdomain": "grace-academy",
    "schoolName": "Grace Academy",
    "onboardingUrl": "http://grace-academy.lvh.me:3000/onboarding"
  }
}
```

---

### POST `/api/schools/resend-verification`

Resend the verification email (if SMTP configured).

```
Rate limit: none
Auth: Bearer token + admin role
```

---

### GET `/api/schools/plans`

List available subscription plans.

```
Auth: none
```

---

### GET `/api/schools/templates`

List available website templates.

```
Auth: none
```

---

## 3. Onboarding Endpoints (`/api/schools/onboarding`)

All require `Bearer token` + `admin` role.

### GET `/api/schools/onboarding`

Load current school's onboarding data.

```
Auth: Bearer token + admin
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schoolId": "uuid",
    "schoolName": "Grace Academy",
    "tagline": "Shaping leaders",
    "subdomain": "grace-academy",
    "email": "admin@graceacademy.cm",
    "phone": "+237600000000",
    "address": "123 Main St",
    "city": "Douala",
    "region": "Littoral",
    "logoUrl": "https://.../logo.png",
    "heroImageUrl": "https://.../hero.jpg",
    "heroImageUrl2": null,
    "primaryColor": "#085041",
    "websiteDescription": "A brief description...",
    "yearFounded": "1995",
    "websiteStats": { "studentsEnrolled": "248", "qualifiedTeachers": "32" },
    "websiteValues": [{ "name": "Excellence", "description": "..." }],
    "educationalSystems": ["anglophone_general"],
    "examType": "GCE",
    "examPassRate": "94",
    "ranking": "1st",
    "rankingCity": "Douala",
    "aboutPhotos": [{ "url": "https://...", "caption": "Library" }],
    "classesConfig": { "levels": [] },
    "templateCode": "modern",
    "onboardingCompleted": true,
    "websitePublished": true,
    "emailVerified": true,
    "gallery": [],
    "urls": {
      "dashboardUrl": "http://grace-academy.lvh.me:3000/dashboard",
      "websiteUrl": "http://grace-academy.lvh.me:3000/site"
    }
  }
}
```

---

### PUT `/api/schools/onboarding`

Save onboarding data. All fields are optional — send only what changed.

```
Auth: Bearer token + admin
```

**Request body** (all fields optional):
```json
{
  "schoolName": "Grace Academy",
  "tagline": "Shaping leaders",
  "city": "Douala",
  "region": "Littoral",
  "address": "123 Main St",
  "phone": "+237600000000",
  "email": "admin@graceacademy.cm",
  "yearFounded": "1995",
  "primaryColor": "#085041",
  "templateCode": "modern",
  "websiteDescription": "Description...",
  "websiteStats": { "studentsEnrolled": "248" },
  "websiteValues": [{ "name": "Excellence", "description": "..." }],
  "educationalSystems": ["anglophone_general", "francophone_general"],
  "heroImageUrl2": "https://.../hero2.jpg",
  "examType": "GCE",
  "examPassRate": "94",
  "ranking": "1st",
  "rankingCity": "Douala",
  "aboutPhotos": [{ "url": "https://...", "caption": "Library" }],
  "classesConfig": { "levels": [{ "name": "Form 1", "systems": ["anglophone_general"] }] },
  "onboardingCompleted": true,
  "websitePublished": true
}
```

**Accepted values for `educationalSystems` array:**
| Value | Label |
|-------|-------|
| `anglophone_general` | Anglophone General (GCE O-Level & A-Level) |
| `francophone_general` | Francophone General (BEPC, Probatoire & Baccalaureate) |
| `anglophone_technical` | Anglophone Technical (TVEE IL & AL) |
| `francophone_technical` | Francophone Technical (CAP, Brevet & Baccalaureate Tech) |
| `university` | University (LMD System) |

---

### POST `/api/schools/onboarding/media`

Upload an image (logo, hero, or gallery).

```
Auth: Bearer token + admin
Content-Type: multipart/form-data
```

**Fields:**
- `file` — the image file
- `mediaType` — one of: `logo`, `hero`, `gallery`

**Response:**
```json
{
  "success": true,
  "data": {
    "mediaId": "uuid",
    "url": "https://res.cloudinary.com/.../image.jpg",
    "mediaType": "gallery"
  }
}
```

---

## 4. Public Website Endpoints (`/api/website/`)

### GET `/api/website/public?subdomain=xxx`

Get public data for a school's landing page.

```
Auth: none
```

**Query params:** `subdomain` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Grace Academy",
    "tagline": "Shaping leaders",
    "logoUrl": "https://...",
    "heroImageUrl": "https://...",
    "heroImageUrl2": null,
    "primaryColor": "#085041",
    "websiteDescription": "...",
    "websiteStats": {},
    "websiteValues": [],
    "examType": "GCE",
    "examPassRate": "94",
    "ranking": "1st",
    "rankingCity": "Douala",
    "aboutPhotos": [],
    "yearFounded": "1995",
    "city": "Douala",
    "region": "Littoral",
    "template": { "code": "modern", "name": "Modern" }
  }
}
```

---

## 5. Student Management Endpoints (`/api/students/`)

All require `Bearer token` + matching subdomain.

| Action | Method | Endpoint | Body / Params |
|--------|--------|----------|---------------|
| List | `GET` | `/api/students` | `?limit=50&offset=0&search=&status=&className=` |
| Create | `POST` | `/api/students` | `{ firstName, lastName, className, studentNumber, dateOfBirth, gender, feeStatus }` |
| Get one | `GET` | `/api/students/:id` | — |
| Update | `PUT` | `/api/students/:id` | Same as create fields |
| Delete | `DELETE` | `/api/students/:id` | — |

List response:
```json
{
  "success": true,
  "data": {
    "students": [{ ... }],
    "total": 42,
    "limit": 50,
    "offset": 0
  }
}
```

---

## 6. Guardian Endpoints (`/api/guardians/`)

All require `Bearer token` + matching subdomain.

| Action | Method | Endpoint | Body / Params |
|--------|--------|----------|---------------|
| Create | `POST` | `/api/guardians` | `{ studentId, firstName, lastName, relationship, phone, email }` |
| List for student | `GET` | `/api/guardians/student/:studentId` | — |
| Get one | `GET` | `/api/guardians/:id` | — |
| Update | `PUT` | `/api/guardians/:id` | Same as create |
| Delete | `DELETE` | `/api/guardians/:id` | — |

---

## 7. Rate Limiting Reference

Handle HTTP 429 responses gracefully:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `POST /api/schools/register` | 10 | 15 min |
| `POST /api/auth/login` | 20 | 15 min |
| `POST /api/auth/verify-school` | 30 | 15 min |
| `POST /api/auth/forgot-password` | 5 | 15 min |
| `POST /api/auth/reset-password` | 10 | 15 min |

429 response body:
```json
{
  "success": false,
  "message": "Too many registration attempts. Try again in 15 minutes."
}
```

---

## 8. Frontend Routes You Need

| Route | Page Component | Backend Call |
|-------|---------------|--------------|
| `/signup` or `/register` | RegisterPage | `POST /api/schools/register` |
| `/login` | LoginPage | `POST /api/auth/verify-school` → `POST /api/auth/login` → `GET /api/auth/me` |
| `/forgot-password` | ForgotPasswordPage | `POST /api/auth/forgot-password` |
| `/reset-password` | ResetPasswordPage | `POST /api/auth/reset-password` |
| `/onboarding` | OnboardingWizard | `GET /api/schools/onboarding`, `PUT /api/schools/onboarding` |
| `/educational-system-selection` | EducationalSystemSelectionPage | `PUT /api/schools/onboarding` |
| `/dashboard/*` | AdminDashboard + sub-pages | Protected; uses `GET /api/auth/me` data |
| `/site` | PublicWebsitePage | `GET /api/website/public?subdomain=xxx` |
| `/verify-email` | VerifyEmailPage | `GET /api/schools/verify-email?token=xxx` |

---

## 9. Subdomain / Tenant Context

All school-scoped pages are at `{subdomain}.{domain}:3000/...`. The frontend can extract the subdomain from `window.location.hostname` using a helper:

```js
function getSubdomainFromHost() {
  const hostname = window.location.hostname.toLowerCase();
  const match = hostname.match(/^([a-z0-9-]+)\.(lvh\.me|akademee\.cm)$/);
  return match ? match[1] : null;
}
```

This subdomain is needed for:
- `POST /api/auth/login` body
- `POST /api/auth/forgot-password` body
- `GET /api/website/public?subdomain=xxx`
- `X-School-Subdomain` header (legacy support)
