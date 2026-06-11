# PostgreSQL Migration Guide

## Overview
The Akademee backend has been successfully migrated from MongoDB to PostgreSQL with Supabase as the database provider.

## Setup Steps

### 1. Create Supabase Project
- Visit [supabase.com](https://supabase.com)
- Create a new project
- You'll receive connection details

### 2. Environment Configuration
Create a `.env` file in the backend directory:

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.rwswpbffdanskhtuxgcp.supabase.co:5432/akademee
PORT=5000
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
```

Replace:
- `[YOUR-PASSWORD]` with your Supabase password
- Update the host/port if different from provided

### 3. Create Database Tables
Option A: Using Supabase SQL Editor
- Go to Supabase dashboard → SQL Editor
- Copy contents from `db/schema.sql`
- Paste and execute in the SQL editor

Option B: Using psql CLI
```bash
psql -U postgres -h db.rwswpbffdanskhtuxgcp.supabase.co -d akademee -f db/schema.sql
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Development Server
```bash
npm run dev
```

The server will start on port 5000 (or as specified in .env)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Students
- `GET /api/students` - List all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student

### Schools
- `GET /api/schools` - List schools
- `GET /api/schools/:id` - Get school by ID
- `POST /api/schools` - Create school

### Classes
- `GET /api/classes` - List classes
- `GET /api/classes/:id` - Get class by ID
- `POST /api/classes` - Create class

### Grades
- `GET /api/grades` - List grades
- `GET /api/grades/student/:studentId` - Get student grades
- `POST /api/grades` - Create grade

### Attendance
- `GET /api/attendance` - List attendance records
- `GET /api/attendance/student/:studentId` - Get student attendance
- `POST /api/attendance` - Mark attendance

### Finance
- `GET /api/finance` - List payments
- `GET /api/finance/summary` - Finance summary
- `GET /api/finance/student/:studentId` - Get student payments
- `POST /api/finance` - Record payment

### Reports
- `GET /api/reports/pdf/:studentId` - Generate student report PDF

## Database Schema

The following tables are created:
- `users` - System users with roles
- `schools` - School information
- `classes` - Classes within schools
- `students` - Student records
- `subjects` - Available subjects
- `grades` - Student grades
- `attendance` - Attendance records
- `payments` - Payment records
- `academic_years` - Academic year periods

All tables include `created_at` and `updated_at` timestamps.

## Troubleshooting

### Connection Errors
- Verify DATABASE_URL is correct in `.env`
- Check that Supabase project is active
- Ensure IP is whitelisted in Supabase (usually automatic)

### Missing Tables
- Confirm schema.sql was executed successfully
- Check Supabase SQL Editor for errors

### Query Failures
- Ensure table names match exactly (lowercase with underscores)
- Check that foreign key references are valid
- Verify required fields are provided in POST/PUT requests
