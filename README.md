# Akademee

A comprehensive school management system built with modern web technologies. Akademee enables schools to manage students, grades, attendance, finances, and generate detailed academic reports—all through a multi-tenant platform with role-based access control.

## Features

- **Multi-Tenant Architecture**: Support for multiple schools with subdomain-based routing
- **Role-Based Access Control**: ADMIN, TEACHER, and STUDENT roles with fine-grained permissions
- **Student Management**: Complete student profiles with class assignments and tracking
- **Academic Grading**: Subject-based grading system with automatic average calculation (Anglophone system)
- **Attendance Tracking**: Daily attendance recording with PRESENT, ABSENT, and LATE statuses
- **Financial Management**: Student payment tracking, fee management, and finance reporting
- **Report Generation**: Automated PDF report card generation for students
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Responsive UI**: Modern React-based frontend with Vite for fast development

## Tech Stack

### Frontend
- **React 18+** – UI framework
- **Vite** – Fast bundler and dev server
- **JavaScript/JSX** – Language
- **CSS/Tailwind** (recommended) – Styling

### Backend
- **Node.js + Express** – REST API server
- **MongoDB + Mongoose** – Database and ODM
- **JWT** – Authentication tokens
- **bcryptjs** – Password hashing
- **PDFKit** – PDF report generation
- **Morgan** – HTTP request logging
- **Helmet** – Security headers
- **CORS** – Cross-origin resource sharing

## Project Structure

```
akademee/
├── backend/                           <- Node.js + Express + Mongoose server
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                 <- MongoDB Atlas connection
│   │   │   └── jwt.js                <- JWT configuration
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js               <- JWT verification
│   │   │   ├── roleCheck.js          <- Role-based access control
│   │   │   └── schoolResolver.js     <- School identification via subdomain
│   │   │
│   │   ├── models/
│   │   │   ├── School.model.js
│   │   │   ├── User.model.js
│   │   │   ├── Student.model.js
│   │   │   ├── Class.model.js
│   │   │   ├── Subject.model.js
│   │   │   ├── AcademicYear.model.js
│   │   │   ├── Grade.model.js
│   │   │   ├── Attendance.model.js
│   │   │   └── Payment.model.js
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── school.routes.js
│   │   │   ├── student.routes.js
│   │   │   ├── class.routes.js
│   │   │   ├── grade.routes.js
│   │   │   ├── attendance.routes.js
│   │   │   ├── finance.routes.js
│   │   │   └── report.routes.js
│   │   │
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── student.controller.js
│   │   │   ├── class.controller.js
│   │   │   ├── grade.controller.js
│   │   │   ├── attendance.controller.js
│   │   │   ├── finance.controller.js
│   │   │   └── report.controller.js
│   │   │
│   │   ├── services/
│   │   │   ├── gradeCalculator.js    <- Anglophone average calculation
│   │   │   └── pdfGenerator.js       <- Report card PDF generation
│   │   │
│   │   └── app.js                    <- Express app entry point
│   │
│   ├── .env.example                  <- Environment template
│   ├── package.json                  <- Node dependencies
│   └── .gitignore
│
├── frontend/                          <- React + Vite application
│   ├── src/
│   │   ├── api/
│   │   │   ├── auth.api.js           <- Auth API calls
│   │   │   ├── students.api.js       <- Student API calls
│   │   │   ├── grades.api.js         <- Grade API calls
│   │   │   └── finance.api.js        <- Finance API calls
│   │   │
│   │   ├── components/
│   │   │   ├── common/               <- Reusable UI components
│   │   │   ├── layout/               <- Sidebar, Navbar, PageWrapper
│   │   │   └── forms/                <- Form components
│   │   │
│   │   ├── pages/
│   │   │   ├── auth/                 <- Login, Register
│   │   │   ├── admin/                <- Admin dashboard
│   │   │   ├── teacher/              <- Teacher portal
│   │   │   ├── student/              <- Student portal
│   │   │   └── superadmin/           <- Super admin panel
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx       <- Global auth state
│   │   │
│   │   ├── hooks/                    <- Custom React hooks
│   │   ├── utils/                    <- Helper functions
│   │   ├── App.jsx                   <- App routes
│   │   └── main.jsx                  <- React entry point
│   │
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .gitignore
│
├── docs/
│   ├── CHANGELOG.md                  <- Project history
│   └── API.md                        <- API endpoint documentation
│
├── .gitignore
└── README.md
```

## Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (Atlas cloud or local instance)

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

4. Update `.env` with your configuration:
```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
PORT=5000
```

5. Start development server:
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

The frontend will typically run on `http://localhost:5173`.

## Running the Full Application

In separate terminal windows:

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
```

## API Endpoints

See [docs/API.md](docs/API.md) for complete endpoint documentation.

### Core Endpoints:
- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`
- **Students**: `GET/POST/PUT/DELETE /api/students`
- **Grades**: `GET /api/grades`
- **Attendance**: `GET /api/attendance`
- **Finance**: `GET /api/finance`
- **Reports**: `GET /api/reports/pdf/:studentId`

## Environment Variables

### Backend (.env)
```env
MONGO_URI              # MongoDB connection string
JWT_SECRET             # Secret key for JWT signing
JWT_EXPIRES_IN         # Token expiration time (default: 7d)
PORT                   # Server port (default: 5000)
```

## User Roles

- **ADMIN** – School administrator with full access to school data
- **TEACHER** – Can manage classes, enter grades, mark attendance
- **STUDENT** – Can view own grades, attendance, and fees

## Key Features Implementation

### Grade Calculation
The backend includes an Anglophone average calculator in `services/gradeCalculator.js`. This calculates subject averages based on term scores.

### PDF Report Generation
Report cards are generated as PDFs using PDFKit. Endpoint: `GET /api/reports/pdf/:studentId`

### Authentication Flow
1. User registers/logs in
2. Backend validates credentials and issues JWT
3. Frontend stores token and includes in Authorization header
4. Middleware verifies token on protected routes

## Development Guidelines

- **API Calls**: Centralize in `frontend/src/api/` directory
- **State Management**: Use React Context for global state (auth, school info)
- **Components**: Keep components in appropriate folders (common, layout, forms)
- **Styles**: Use CSS modules or Tailwind CSS for styling
- **Backend**: Follow MVC pattern (models → controllers → routes)

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m 'Add your feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

## License

This project is proprietary. Unauthorized copying or distribution is prohibited.

## Support

For issues, questions, or contributions, please contact the development team.

---

**Built with ❤️ for schools worldwide**
