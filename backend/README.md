# Akademee Backend

This is the backend service for Akademee. It is built with Node.js, Express, and PostgreSQL, and exposes REST APIs for authentication, student management, grades, attendance, finance, and report generation.

## Features

- Express REST API server
- PostgreSQL database schema and seed support
- JWT authentication
- Role-based access control
- PDF report generation with PDFKit
- Database initialization script with schema and seed execution

## Prerequisites

- Node.js 16+ or newer
- npm
- PostgreSQL database

## Setup

1. Navigate to the backend folder:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create the `.env` file:

```bash
copy .env.example .env
```

4. Edit `.env` and set your PostgreSQL connection:

```env
DATABASE_URL=postgres://username:password@localhost:5432/your_database
JWT_SECRET=replace_with_a_secure_random_secret
JWT_EXPIRES_IN=7d
PORT=5000
```

## Database initialization

The backend includes a database initialization script in `backend/db/init_db.js`. It applies `backend/db/schema.sql` and then runs `backend/db/seed.sql` if it exists.

Run the database init command:

```bash
npm run db:init
```

This will:

- create required tables and indexes
- insert seed data into core tables

## Running the backend

Start the Express server in development mode:

```bash
npm run dev
```

Or run it directly:

```bash
npm start
```

The server listens on the port configured in `.env` (default `5000`).

## API Endpoints

The backend exposes the following main REST routes:

- `GET /` — health check
- `POST /api/auth/register` — register a new user
- `POST /api/auth/login` — login and receive JWT
- `GET /api/auth/profile` — get authenticated user profile

- `GET /api/schools` — list schools
- `GET /api/schools/:id` — get school details
- `POST /api/schools` — create a new school

- `GET /api/students` — list students
- `POST /api/students` — create a student
- `GET /api/students/:id` — get a student
- `PUT /api/students/:id` — update a student
- `DELETE /api/students/:id` — delete a student

- `GET /api/classes` — list classes
- `GET /api/classes/:id` — get class details
- `POST /api/classes` — create a class

- `GET /api/grades` — list grades
- `GET /api/grades/student/:studentId` — get grades for a student
- `POST /api/grades` — create a grade entry

- `GET /api/attendance` — list attendance records
- `GET /api/attendance/student/:studentId` — get attendance for a student
- `POST /api/attendance` — create an attendance record

- `GET /api/finance` — list finance entries
- `GET /api/finance/summary` — get finance summary
- `GET /api/finance/student/:studentId` — get finance details for a student
- `POST /api/finance` — create a finance/payment record

- `GET /api/reports/pdf/:studentId` — generate a student report PDF

## Important files

- `src/app.js` — Express app entry point
- `src/config/db.js` — PostgreSQL connection setup
- `db/schema.sql` — database schema definitions
- `db/seed.sql` — seed data for development/testing
- `package.json` — backend dependencies and scripts

## Notes

- If `psql` is installed, the init script will use it first, with a fallback to the Node Postgres client.
- The seed file is designed to be idempotent where possible and will use `ON CONFLICT DO NOTHING` for many inserts.
- Make sure your `DATABASE_URL` points to the correct database before running `npm run db:init`.
