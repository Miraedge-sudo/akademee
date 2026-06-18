# Frontend API Reference (React + Vite Migration)

This document maps the vanilla HTML/JS pages to REST endpoints so you can rebuild the frontend in **React + Vite** without changing the backend.

## Base configuration

```typescript
// src/config/akademee.ts
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

export function getSubdomainFromHost(): string | null {
  const hostname = window.location.hostname.toLowerCase();
  // match {school}.lvh.me or {school}.akademee.cm
}

export function authHeaders(subdomain?: string) {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(subdomain ? { 'X-School-Subdomain': subdomain } : {}),
  };
}
```

Load domain config once at app boot:

```
GET /api/config/domains
```

---

## Auth flow

| Step | Endpoint | Notes |
|------|----------|-------|
| Register school | `POST /api/schools/register` | Returns `token`, `user`, `urls`, `devVerifyUrl` |
| Verify email | `GET /api/schools/verify-email?token=` | Public; returns `onboardingUrl` |
| Resend verify | `POST /api/schools/resend-verification` | Auth + admin |
| Login | `POST /api/auth/login` | Body: `{ subdomain, email, password }` |
| Current user | `GET /api/auth/me` | Auth |
| Logout | `POST /api/auth/logout` | Auth; clear localStorage client-side |

**Login blocked** until `school.email_verified = true` → response `403` with `data.code = 'EMAIL_NOT_VERIFIED'`.

**Session storage (React):**

```typescript
localStorage.setItem('authToken', token);
localStorage.setItem('user', JSON.stringify(user));
```

After registration, redirect to `{subdomain}.{tenantDomain}/verify` and pass session (hash or state) because `localStorage` is per-origin.

---

## Onboarding & landing page

| Action | Endpoint |
|--------|----------|
| Load onboarding | `GET /api/schools/onboarding` |
| Save / publish | `PUT /api/schools/onboarding` |
| Upload media | `POST /api/schools/onboarding/media` (multipart: `file`, `mediaType`) |

**Publish body example:**

```json
{
  "schoolName": "Grace Bilingual Academy",
  "tagline": "Shaping leaders",
  "city": "Douala",
  "region": "Littoral",
  "primaryColor": "#085041",
  "templateCode": "modern",
  "websiteDescription": "...",
  "websiteStats": {
    "studentsEnrolled": "248",
    "qualifiedTeachers": "32",
    "gcePassRate": "94",
    "yearsOfOperation": "27"
  },
  "websiteValues": [{ "name": "Excellence", "description": "..." }],
  "onboardingCompleted": true,
  "websitePublished": true
}
```

**Public landing page data (vitrine):**

```
GET /api/website/public?subdomain={school}
Header: X-School-Subdomain: {school}
```

Response includes `template.code` → route to:

| Template | Page / React route |
|----------|------------------|
| `modern` | `/pages/akademee_vitrine_modern.html` → `/` |
| `classic` | `/pages/akademee_vitrine_classic.html` |
| `minimal` | `/pages/akademee_vitrine_minimal.html` |

---

## Students (tenant-scoped)

All require `Authorization` + matching subdomain.

| Action | Endpoint |
|--------|----------|
| List | `GET /api/students?limit=50&offset=0&search=&status=&className=` |
| Create | `POST /api/students` |
| Get one | `GET /api/students/:id` |
| Update | `PUT /api/students/:id` |
| Delete | `DELETE /api/students/:id` |

**Create body:**

```json
{
  "firstName": "Alice",
  "lastName": "Ngo",
  "className": "Form 3A",
  "studentNumber": "STU-001",
  "dateOfBirth": "2010-03-12",
  "gender": "female",
  "feeStatus": "paid"
}
```

**List response:**

```json
{
  "success": true,
  "data": {
    "students": [...],
    "total": 42,
    "limit": 50,
    "offset": 0
  }
}
```

---

## Guardians (tenant-scoped)

| Action | Endpoint |
|--------|----------|
| Create | `POST /api/guardians` |
| List for student | `GET /api/guardians/student/:studentId` |
| Get one | `GET /api/guardians/:id` |
| Update | `PUT /api/guardians/:id` |
| Delete | `DELETE /api/guardians/:id` |

**Create body:**

```json
{
  "studentId": "uuid",
  "firstName": "Paul",
  "lastName": "Ngo",
  "relationship": "father",
  "phone": "+237600000000",
  "email": "parent@email.com"
}
```

Typical flow after creating a student:

```typescript
const student = await api.post('/students', payload);
await api.post('/guardians', { studentId: student.id, ...guardian });
```

---

## Uniqueness rules

| Field | Scope | Error |
|-------|-------|-------|
| `subdomain` | Global | 409 Subdomain already exists |
| `email` (school) | Global | 409 School email is already registered |
| `adminEmail` | Global (users.email) | 409 Admin email is already in use |

Check before submit:

```
POST /api/schools/check-subdomain  { "subdomain": "my-school" }
```

---

## Suggested React routes

```
/register                          → RegisterPage
/:subdomain/verify                 → VerifyEmailPage
/:subdomain/onboarding               → OnboardingWizard
/:subdomain/login                    → LoginPage
/:subdomain/dashboard                → AdminDashboard
/:subdomain/dashboard/students       → StudentsPage
/:subdomain/dashboard/students/new   → AddStudentPage
/                                    → PublicVitrine (loads /api/website/public)
```

Use a **tenant context** (`schoolId`, `subdomain`) from JWT + `/api/auth/me`.

---

## Vanilla JS reference files

| Concern | File |
|---------|------|
| Config + session | `js/akademee-config.js` |
| Onboarding | `js/akademee-onboarding.js` |
| Dashboard | `js/akademee-dashboard.js` |
| Students | `js/akademee-students.js` |
| Vitrine | `js/akademee-vitrine.js` |

Replace these with React hooks/services (`useAuth`, `useSchool`, `useStudents`, `useGuardians`) calling the same endpoints.
