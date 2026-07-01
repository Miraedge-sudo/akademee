# Akademee

A comprehensive school management system built with modern web technologies. Akademee enables schools to manage students, grades, attendance, finances, and generate detailed academic reports — all through a multi-tenant platform with role-based access control.

## Features

- **Multi-Tenant Architecture**: Support for multiple schools with subdomain-based routing
- **Role-Based Access Control**: ADMIN, TEACHER, and STUDENT roles with fine-grained permissions
- **School Registration & Onboarding**: 3-step registration wizard + 5-step onboarding for website setup
- **Student Management**: Complete student profiles with class assignments and tracking
- **Academic Grading**: Subject-based grading system with automatic average calculation
- **Attendance Tracking**: Daily attendance recording with PRESENT, ABSENT, and LATE statuses
- **Financial Management**: Student payment tracking, fee management, and finance reporting
- **Report Generation**: Automated PDF report card generation for students
- **Educational System Support**: Multiple Cameroonian systems (Anglophone General, Francophone General, Technical, University)
- **School Website Builder**: Customizable public website with logo, colors, templates, and content
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Responsive UI**: Modern React-based frontend with Vite for fast development

## Tech Stack

### Frontend
- **React 19+** — UI framework
- **Vite 8+** — Fast bundler and dev server
- **JavaScript/JSX** — Language
- **Tailwind CSS 4** — Styling
- **react-router-dom v7** — Client-side routing
- **i18next** — Internationalization (EN/FR)
- **Axios** — HTTP client

### Backend
- **Node.js + Express 4.18+** — REST API server
- **PostgreSQL (Supabase)** — Database
- **JWT** — Authentication tokens
- **bcrypt** — Password hashing
- **PDFKit** — PDF report generation
- **Nodemailer** — Email sending (SMTP)
- **Multer + Cloudinary** — File uploads
- **express-validator** — Input validation
- **express-rate-limit** — Rate limiting

## Project Structure

```
akademee/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express app entry point
│   │   ├── server.js               # Server start
│   │   ├── config/                 # Configuration files
│   │   │   ├── database.js         # PostgreSQL connection
│   │   │   ├── jwt.js              # JWT configuration
│   │   │   ├── email.js            # SMTP email config
│   │   │   ├── cors.js             # CORS options
│   │   │   ├── cloudinary.js       # Cloudinary config
│   │   │   ├── multer.js           # File upload config
│   │   │   └── domains.js          # Multi-tenant domain config
│   │   │
│   │   ├── database/
│   │   │   └── migrations/         # SQL migration scripts (001-010)
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js   # JWT verification
│   │   │   ├── role.middleware.js   # RBAC enforcement
│   │   │   ├── tenant.middleware.js # School tenant resolution
│   │   │   ├── schoolResolver.middleware.js
│   │   │   ├── upload.middleware.js # File upload handler
│   │   │   ├── validate.middleware.js # Validation runner
│   │   │   └── error.middleware.js  # Global error handler
│   │   │
│   │   ├── controllers/            # Route handlers
│   │   ├── routes/                 # API route definitions
│   │   ├── services/               # Business logic layer
│   │   ├── validators/             # express-validator schemas
│   │   └── utils/                  # Helpers (response, slug, domain)
│   │
│   ├── scripts/                    # Migration & seed scripts
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/               # API, context, hooks, utils, i18n
│   │   │   ├── features/           # Feature modules (auth, onboarding, dashboard, etc.)
│   │   │   └── layout/             # Layout components (Sidebar, Navbar, etc.)
│   │   ├── App.jsx                 # Route definitions
│   │   └── main.jsx                # React entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── docs/                           # Documentation files
└── akademee_design_frontend/       # Static HTML design prototypes
```

## Installation

### Prerequisites
- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **PostgreSQL** (Supabase recommended)

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from template:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration (see Environment Variables section)

5. Run database migrations:
```bash
npm run migrate
```

6. Start development server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`.

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`.

## Running the Full Application

In separate terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Access the application at `http://localhost:5173`.

## API Endpoints

See [docs/API.md](docs/API.md) and [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for complete endpoint documentation.

### Core Endpoints:
| Method | Path | Description | Auth |
|--------|------|-------------|------|
| POST | `/api/schools/register` | Register a new school + admin user | Public |
| POST | `/api/schools/check-subdomain` | Check subdomain availability | Public |
| GET | `/api/schools/plans` | Get subscription plans | Public |
| GET | `/api/schools/templates` | Get website templates | Public |
| GET | `/api/schools/verify-email` | Verify school email | Public |
| POST | `/api/auth/login` | Login | Public (rate-limited) |
| POST | `/api/auth/verify-school` | Verify school exists | Public |
| GET | `/api/auth/me` | Get current user | Protected |
| POST | `/api/auth/logout` | Logout | Protected |
| GET | `/api/schools/onboarding` | Get onboarding data | Admin |
| PUT | `/api/schools/onboarding` | Save onboarding data | Admin |
| POST | `/api/schools/onboarding/media` | Upload media (logo/hero) | Admin |
| POST | `/api/schools/resend-verification` | Resend verification email | Admin |

## Registration & Onboarding Flow

1. **Register** (`POST /api/schools/register`) — Creates school, admin user, and returns JWT
2. **Onboarding** (`GET/PUT /api/schools/onboarding`) — 5-step wizard: logo, color, tagline, description, hero image, template selection
3. **Educational System Selection** (`PUT /api/schools/onboarding`) — Select one or more academic systems
4. **Dashboard** — Redirect to `/dashboard` after setup

## Environment Variables

See `.env.example` for all available variables. Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `PORT` | Server port | `5000` |
| `SMTP_HOST` | SMTP server for emails | Required for email |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account | Required for uploads |
| `TENANT_DEV_DOMAIN` | Development domain | `lvh.me` |
| `TENANT_PROD_DOMAIN` | Production domain | `akademee.com` |

## User Roles

- **ADMIN** — School administrator with full access to school data
- **TEACHER** — Can manage classes, enter grades, mark attendance
- **STUDENT** — Can view own grades, attendance, and fees

## License

This project is proprietary. Unauthorized copying or distribution is prohibited.
