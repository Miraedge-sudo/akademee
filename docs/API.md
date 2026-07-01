# API Reference

This document lists available API endpoints and security requirements.

## Public Endpoints (No Auth Required)

### Health
- `GET /api/health` — Health check

### Auth
- `POST /api/auth/login` — Login with subdomain + email + password (rate-limited: 20 req/15min)
- `POST /api/auth/verify-school` — Check if a school exists by subdomain

### School Registration
- `POST /api/schools/register` — Register a new school + admin user (rate-limited: 10 req/15min)
- `POST /api/schools/check-subdomain` — Check subdomain availability
- `GET /api/schools/plans` — Get subscription plans
- `GET /api/schools/templates` — Get website templates
- `GET /api/schools/verify-email` — Verify school email via token

## Authenticated Endpoints

All routes below require a valid `Authorization: Bearer <token>` header.

### Auth
- `GET /api/auth/me` — Get current user profile (with school details, onboarding status)
- `POST /api/auth/logout` — Logout

### School Management
- `GET /api/schools` — List all schools
- `GET /api/schools/:id` — Get school details
- `POST /api/schools` — Create a school (ADMIN role)
- `PUT /api/schools/:id` — Update school (ADMIN role)

### Onboarding (ADMIN role)
- `GET /api/schools/onboarding` — Get onboarding data (logo, colors, template, content)
- `PUT /api/schools/onboarding` — Save onboarding data (partial update, all fields optional)
- `POST /api/schools/onboarding/media` — Upload media (logo/hero/gallery)
- `POST /api/schools/resend-verification` — Resend verification email

### Student Management
- `GET /api/students` — List students
- `GET /api/students/:id` — Get a student
- `POST /api/students` — Create a student (ADMIN role)
- `PUT /api/students/:id` — Update a student (ADMIN role)
- `DELETE /api/students/:id` — Delete a student (ADMIN role)

### Guardian Management
- `GET /api/guardians` — List guardians
- `GET /api/guardians/:id` — Get guardian details
- `POST /api/guardians` — Create a guardian (ADMIN role)
- `PUT /api/guardians/:id` — Update a guardian (ADMIN role)

### Academic Structure
- `GET /api/academics/years` — List academic years
- `POST /api/academics/years` — Create academic year
- `GET /api/classes` — List classes
- `POST /api/classes` — Create a class
- `GET /api/subjects` — List subjects
- `POST /api/subjects` — Create a subject

### Grades
- `GET /api/grades` — List grades
- `GET /api/grades/student/:studentId` — Get grades for a student
- `POST /api/grades` — Create a grade entry
- `PUT /api/grades/:id` — Update a grade

### Attendance
- `GET /api/attendance` — List attendance records
- `GET /api/attendance/student/:studentId` — Get attendance for a student
- `POST /api/attendance` — Create an attendance record

### Finance
- `GET /api/finance/fees` — List fees
- `GET /api/payments` — List payments
- `GET /api/payments/:id` — Get payment details
- `POST /api/payments` — Record a payment

### Reports
- `GET /api/reports/bulletin/:studentId` — Generate PDF report card
- `GET /api/reports/class/:classId` — Class report

### Notifications
- `GET /api/notifications` — List notifications
- `PUT /api/notifications/:id/read` — Mark notification as read

### Config
- `GET /api/config` — System configuration

## Response Format

### Success
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error
```json
{
  "success": false,
  "message": "Error description",
  "error": null,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    { "field": "schoolName", "message": "School name is required" }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Notes
- All `/api/*` resource routes except public ones are protected by JWT authentication
- Role-based restrictions are enforced on creation, update, and delete operations
- Multi-tenant data isolation is enforced via `school_id` in every query
- Rate limiting is applied to login (20/15min) and registration (10/15min) endpoints
