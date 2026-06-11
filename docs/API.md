# API Reference

This document lists available API endpoints and security requirements.

## Public Endpoints
- `GET /api/health` — health check and database connectivity
- `POST /api/auth/register` — register a user
- `POST /api/auth/login` — login and receive JWT

## Authenticated Endpoints
All routes below require a valid `Authorization: Bearer <token>` header.

### Auth
- `GET /api/auth/profile` — retrieve authenticated user profile

### School Management
- `GET /api/schools` — list active schools
- `GET /api/schools/:id` — get school details
- `POST /api/schools` — create a school (roles: `SUPER_ADMIN`, `ADMIN`)

### Student Management
- `GET /api/students` — list students
- `GET /api/students/:id` — get a student
- `POST /api/students` — create a student (roles: `SUPER_ADMIN`, `ADMIN`)
- `PUT /api/students/:id` — update a student (roles: `SUPER_ADMIN`, `ADMIN`)
- `DELETE /api/students/:id` — delete a student (role: `SUPER_ADMIN`)

### Class Management
- `GET /api/classes` — list classes
- `GET /api/classes/:id` — get class details
- `POST /api/classes` — create a class (roles: `SUPER_ADMIN`, `ADMIN`)

### Grade Management
- `GET /api/grades` — list grades
- `GET /api/grades/student/:studentId` — list grades for a student
- `POST /api/grades` — create a grade entry (roles: `SUPER_ADMIN`, `ADMIN`, `TEACHER`)

### Attendance Management
- `GET /api/attendance` — list attendance records
- `GET /api/attendance/student/:studentId` — get attendance for a student
- `POST /api/attendance` — create an attendance record (roles: `SUPER_ADMIN`, `ADMIN`, `TEACHER`)

### Finance Management
- `GET /api/finance` — list payments
- `GET /api/finance/summary` — payment summary (roles: `SUPER_ADMIN`, `ADMIN`, `ACCOUNTANT`)
- `GET /api/finance/student/:studentId` — get payments for a student
- `POST /api/finance` — record a payment (roles: `SUPER_ADMIN`, `ADMIN`, `ACCOUNTANT`)

### Report Generation
- `GET /api/reports/pdf/:studentId` — download a PDF report card for a student

### Enrollment Management
- `GET /api/enrollments` — list enrollments
- `GET /api/enrollments/:id` — get enrollment details
- `POST /api/enrollments` — create an enrollment (roles: `SUPER_ADMIN`, `ADMIN`)
- `PUT /api/enrollments/:id` — update enrollment (roles: `SUPER_ADMIN`, `ADMIN`)
- `DELETE /api/enrollments/:id` — delete enrollment (role: `SUPER_ADMIN`)

### Fee Structure Management
- `GET /api/fee-structures` — list fee structures
- `GET /api/fee-structures/:id` — get fee structure details
- `POST /api/fee-structures` — create a fee structure (roles: `SUPER_ADMIN`, `ADMIN`, `ACCOUNTANT`)
- `PUT /api/fee-structures/:id` — update fee structure (roles: `SUPER_ADMIN`, `ADMIN`, `ACCOUNTANT`)

### Offline Sync Queue
- `GET /api/sync-queue` — list sync queue items
- `GET /api/sync-queue/status/:status` — get items by sync status
- `GET /api/sync-queue/failed-items` — get failed items eligible for retry
- `POST /api/sync-queue/:id/synced` — mark item as synced
- `POST /api/sync-queue/:id/failed` — mark item as failed
- `POST /api/sync-queue/:id/retry` — retry failed sync (roles: `SUPER_ADMIN`, `ADMIN`)

## Notes
- All `/api/*` resource routes except `/api/auth/*` and `/api/health` are protected by JWT authentication.
- Role-based restrictions are enforced on creation, update, and delete operations per route.
