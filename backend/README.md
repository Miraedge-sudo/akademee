# Akademee Backend - API Server

A comprehensive school management system backend built with **Express.js**, **PostgreSQL (Supabase)**, and **Node.js v22+**.

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── config/                          # Configuration files
│   │   ├── database.js                  # PostgreSQL connection via postgres driver
│   │   ├── cloudinary.js                # Cloudinary image storage config
│   │   ├── multer.js                    # File upload configuration
│   │   ├── jwt.js                       # JWT token settings
│   │   ├── cors.js                      # CORS allowed domains
│   │   └── domains.js                   # Tenant domain configuration
│   │
│   ├── database/                        # Database related files
│   │   ├── migrations/                  # SQL schema migration files
│   │   ├── functions/                   # PostgreSQL stored procedures
│   │   └── seeds/                       # Seed data for initial setup
│   │
│   ├── middleware/                      # Express middleware
│   │   ├── auth.middleware.js           # JWT verification & authorization
│   │   ├── role.middleware.js           # RBAC permission checking
│   │   ├── schoolResolver.middleware.js # Extract school from subdomain
│   │   ├── tenant.middleware.js         # Attach school_id to request
│   │   ├── upload.middleware.js         # Multer upload handling
│   │   ├── validate.middleware.js       # Request validation
│   │   └── error.middleware.js          # Global error handler
│   │
│   ├── controllers/                     # Request handlers (API endpoint logic)
│   │   ├── auth.controller.js           # Authentication endpoints
│   │   ├── school.controller.js         # School management
│   │   ├── student.controller.js        # Student CRUD operations
│   │   ├── user.controller.js           # User management
│   │   ├── grade.controller.js          # Grading system
│   │   ├── class.controller.js          # Class management
│   │   ├── subject.controller.js        # Subject management
│   │   ├── academicYear.controller.js   # Academic year setup
│   │   ├── attendance.controller.js     # Attendance tracking
│   │   ├── guardian.controller.js       # Guardian management
│   │   ├── payment.controller.js        # Payment processing
│   │   ├── fee.controller.js            # Fee management
│   │   ├── notification.controller.js   # Notifications
│   │   ├── report.controller.js         # Report generation
│   │   └── website.controller.js        # Website/portal management
│   │
│   ├── routes/                          # API endpoint definitions
│   │   ├── auth.routes.js
│   │   ├── school.routes.js
│   │   ├── student.routes.js
│   │   ├── user.routes.js
│   │   ├── grade.routes.js
│   │   ├── class.routes.js
│   │   ├── subject.routes.js
│   │   ├── academic.routes.js
│   │   ├── attendance.routes.js
│   │   ├── guardian.routes.js
│   │   ├── payment.routes.js
│   │   ├── finance.routes.js
│   │   ├── notification.routes.js
│   │   ├── report.routes.js
│   │   ├── website.routes.js
│   │   └── config.routes.js
│   │
│   ├── validators/                      # Request validation schemas
│   │   ├── auth.validator.js
│   │   ├── school.validator.js
│   │   ├── student.validator.js
│   │   ├── grade.validator.js
│   │   └── payment.validator.js
│   │
│   ├── services/                        # Business logic layer
│   │   ├── auth.service.js              # Login/register logic
│   │   ├── school.service.js            # School onboarding & management
│   │   └── website.service.js           # Website/portal services
│   │
│   ├── uploads/                         # Temporary file storage
│   │
│   ├── utils/                           # Utility functions
│   │   ├── response.js                  # Standardized API responses
│   │   ├── constants.js                 # Application constants
│   │   ├── domainHelper.js              # Domain/tenant utilities
│   │   └── slugGenerator.js             # URL slug generation
│   │
│   ├── app.js                           # Express app setup & middleware
│   └── server.js                        # Server entry point
│
├── scripts/
│   ├── migrate.js                       # Database migration runner
│   ├── seed.js                          # Database seeding script
│   └── testConnection.js                # Database connection test
│
├── package.json                         # Node.js dependencies
├── .env                                 # Environment variables (DO NOT COMMIT)
├── .env.example                         # Environment template
├── .gitignore
└── README.md                            # This file
```
## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 14.0.0 (tested with v22.14.0)
- **npm** or **yarn**
- **Supabase** account (PostgreSQL database)
- **Cloudinary** account (optional, for image uploads)

### Installation & Setup

1. **Clone and navigate to backend:**
   ```bash
   git clone https://github.com/Miraedge-sudo/akademee.git
   cd akademee/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure environment variables** in `.env`:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   
   # Server
   PORT=5000
   NODE_ENV=development
   
   # JWT
   JWT_SECRET=your_strong_secret_key
   JWT_EXPIRES_IN=7d
   
   # Frontend URLs
   FRONTEND_URL=http://localhost:3000
   FRONTEND_URL_PRODUCTION=https://akademee.cm
   FRONTEND_PORT=3000
   API_BASE_URL=http://localhost:5000
   
   # Cloudinary (for image uploads)
   CLOUDINARY_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   
   # Multi-tenant domains
   TENANT_DEV_DOMAIN=lvh.me
   TENANT_PROD_DOMAIN=akademee.cm
   ```

5. **Run database migrations:**
   ```bash
   npm run migrate
   ```

6. **Seed database with initial data:**
   ```bash
   npm run seed
   ```

7. **Test database connection:**
   ```bash
   npm run testConnection
   ```

8. **Start development server:**
   ```bash
   npm run dev
   ```
   
   Server runs on: `http://localhost:5000`

## 📋 Available Scripts

| Command | Description |
|---------|------------|
| `npm start` | Run production server |
| `npm run dev` | Run development server (with nodemon) |
| `npm run migrate` | Run database migrations |
| `npm run seed` | Seed database with initial data |
| `npm test` | Run test suite |
| `npm run lint` | Check code style with ESLint |
| `npm run lint:fix` | Fix code style issues |

## 🔌 API Endpoints Overview

### Authentication
- `POST /api/auth/register` – Register new user account
- `POST /api/auth/login` – Login with credentials
- `GET /api/auth/logout` – Logout user
- `POST /api/auth/refresh-token` – Get new JWT token

### Schools
- `POST /api/schools` – Create new school
- `GET /api/schools` – List schools
- `GET /api/schools/:id` – Get school details
- `PUT /api/schools/:id` – Update school

### Students
- `POST /api/students` – Create student
- `GET /api/students` – List students
- `GET /api/students/:id` – Get student details
- `PUT /api/students/:id` – Update student
- `DELETE /api/students/:id` – Delete student

### Grades & Academic
- `POST /api/grades` – Record grade
- `GET /api/grades` – List grades
- `GET /api/grades/student/:studentId` – Get student's grades
- `PUT /api/grades/:id` – Update grade
- `POST /api/academic/years` – Manage academic years
- `POST /api/classes` – Manage classes
- `POST /api/subjects` – Manage subjects

### Attendance
- `POST /api/attendance` – Record attendance
- `GET /api/attendance` – List attendance records
- `GET /api/attendance/student/:studentId` – Get student attendance

### Finance
- `POST /api/payments` – Create payment record
- `GET /api/payments` – List payments
- `GET /api/finance/fees` – Manage fees

### Reports & Notifications
- `GET /api/reports/bulletin/:studentId` – Generate report card
- `GET /api/reports/class/:classId` – Class report
- `GET /api/notifications` – Get notifications

See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for complete endpoint documentation.

## 🔐 Authentication & Authorization

### JWT Token Flow
1. User calls `POST /api/auth/login` with credentials
2. Server validates and returns JWT token
3. Client includes token in Authorization header: `Bearer <token>`
4. Middleware verifies token before processing request
5. Token expires after `JWT_EXPIRES_IN` period

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| SUPER_ADMIN | Full system access |
| ADMIN | School administration |
| TEACHER | Class & grade management |
| ACCOUNTANT | Financial operations |
| STUDENT | View own data |
| GUARDIAN | View child data |
| STAFF | General functions |

Roles enforced via `role.middleware.js`

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* actual response data */ },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🏗️ Architecture & Design Patterns

### MVC-style Organization
- **Routes** → Define endpoints
- **Controllers** → Handle HTTP requests
- **Services** → Implement business logic
- **Middleware** → Process requests (auth, validation, etc.)
- **Utils** → Helper functions
- **Validators** → Request validation rules

### Key Middleware
- `auth.middleware.js` – JWT verification
- `role.middleware.js` – RBAC permission checking
- `schoolResolver.middleware.js` – Extract school from subdomain
- `tenant.middleware.js` – Tenant isolation
- `error.middleware.js` – Global error handling
- `validate.middleware.js` – Request validation

## 🛡️ Security Features

✅ **JWT-based authentication** – Stateless, secure tokens  
✅ **Role-Based Access Control** – Fine-grained permissions  
✅ **Password hashing** – bcrypt with salt rounds  
✅ **Input validation** – express-validator for all requests  
✅ **SQL Injection Prevention** – Parameterized queries via postgres driver  
✅ **CORS Configuration** – Whitelist specific domains  
✅ **Error Handling** – No sensitive data in error messages  
✅ **Environment separation** – Dev/prod configs via `.env`  

## 🗄️ Database

### PostgreSQL via Supabase
- Managed PostgreSQL database
- SSL/TLS encrypted connections
- Automatic backups
- Real-time capabilities

### Key Tables
- `schools` – School organizations
- `users` – User accounts & authentication
- `students` – Student records
- `academic_years` – School years
- `classes` – Class sections
- `subjects` – Subjects offered
- `grades` – Student grades
- `attendance` – Attendance records
- `payments` – Payment transactions
- `notifications` – System notifications

### Running Migrations
```bash
# Run all migrations
npm run migrate

# Reset database (careful!)
npm run migrate reset
```

### Seeding Database
```bash
# Populate initial data (roles, templates)
npm run seed
```

## 🧪 Testing

```bash
npm test                    # Run jest tests
npm test -- --coverage      # With coverage report
```

## 📁 File Uploads

Images and documents uploaded via **Cloudinary**:
- Max file size: 10MB
- Supported formats: JPG, PNG, GIF, WebP, PDF, DOC, DOCX

Configure Cloudinary credentials in `.env`

## 🐛 Troubleshooting

### "Missing DATABASE_URL" Error
**Solution:** Ensure `.env` is in project root and `require('dotenv').config()` is called before importing database config.

### CORS Errors
**Solution:** Update `src/config/cors.js` with your frontend domain

### JWT Token Validation Fails
**Solution:** Check token hasn't expired or been modified. Request new token via refresh endpoint.

### Database Connection Timeout
**Solution:** Verify DATABASE_URL is correct and Supabase instance is running

### File Upload Fails
**Solution:** Check Cloudinary credentials in `.env` and file size < 10MB

## 📚 Documentation

- [Main README](../README.md) – Project overview
- [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) – Complete API reference
- [POSTMAN_QUICK_GUIDE.md](../POSTMAN_QUICK_GUIDE.md) – Postman setup
- [SCHEMA_COMPARISON.md](../SCHEMA_COMPARISON.md) – Database schema notes

## 🤝 Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and test
3. Commit: `git commit -m 'Add feature description'`
4. Push: `git push origin feature/your-feature`
5. Open Pull Request

## 📄 License

Proprietary – All rights reserved

## 💬 Support

For questions or issues:
1. Check existing GitHub issues
2. Review API documentation
3. Contact development team

---

**Akademee Backend v1.0.0** | **Node.js v22+** | **Express.js** | **PostgreSQL/Supabase**

## 🌐 Multi-Tenant Support

The system supports multiple schools (multi-tenant):
- Schools are resolved via subdomain (e.g., school-name.akademee.app)
- Tenant middleware automatically attaches `school_id` to requests
- All data is scoped to the school

## 📖 API Documentation

For detailed API documentation, see [API.md](../../docs/API.md)

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For issues and questions, please create an issue in the repository.

---

**Last Updated**: January 2024
**Version**: 1.0.0
