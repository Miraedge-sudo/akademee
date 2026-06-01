# API Reference (scaffold)

This document will list available API endpoints.

## Auth
- `POST /api/auth/register` — register a user
- `POST /api/auth/login` — login

## Students
- `GET /api/students` — list students
- `GET /api/students/:id` — get student
- `POST /api/students` — create student

## Reports
- `GET /api/reports/pdf/:studentId` — download report card PDF
