/**
 * Express Application Setup
 */

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const corsOptions = require('./config/cors');
const { initSentry } = require('./config/sentry');
const requestIdMiddleware = require('./middleware/requestId.middleware');
const httpLogger = require('./middleware/httpLogger.middleware');
const schoolResolverMiddleware = require('./middleware/schoolResolver.middleware');
const tenantMiddleware = require('./middleware/tenant.middleware');
const errorMiddleware = require('./middleware/error.middleware');
const logger = require('./utils/logger');
const { cacheMiddleware } = require('./middleware/cache.middleware');
const configRoutes = require('./routes/config.routes');

// Import routes
const authRoutes = require('./routes/auth.routes');
const schoolRoutes = require('./routes/school.routes');
const websiteRoutes = require('./routes/website.routes');
const userRoutes = require('./routes/user.routes');
const studentRoutes = require('./routes/student.routes');
const guardianRoutes = require('./routes/guardian.routes');
const academicRoutes = require('./routes/academic.routes');
const classRoutes = require('./routes/class.routes');
const subjectRoutes = require('./routes/subject.routes');
const gradeRoutes = require('./routes/grade.routes');
const attendanceRoutes = require('./routes/attendance.routes');
const financeRoutes = require('./routes/finance.routes');
const paymentRoutes = require('./routes/payment.routes');
const reportRoutes = require('./routes/report.routes');
const notificationRoutes = require('./routes/notification.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const periodRoutes = require('./routes/period.routes');
const enrollmentRoutes = require('./routes/enrollment.routes');
const classSubjectRoutes = require('./routes/classSubject.routes');
const subjectTeacherRoutes = require('./routes/subjectTeacher.routes');
const examRoutes = require('./routes/exam.routes');
const gradeCalculationRoutes = require('./routes/gradeCalculation.routes');
const attendanceStatsRoutes = require('./routes/attendanceStats.routes');
const feeCalculationRoutes = require('./routes/feeCalculation.routes');
const userManagementRoutes = require('./routes/userManagement.routes');
const roleRoutes = require('./routes/role.routes');
const auditRoutes = require('./routes/audit.routes');
const announcementRoutes = require('./routes/announcement.routes');
const enrolmentRoutes = require('./routes/enrolment.routes');
const swaggerRoutes = require('./routes/swagger.routes');

const app = express();

// Sentry monitoring (no-op if SENTRY_DSN not set)
const Sentry = initSentry(app);

// Security & parsing
app.use(helmet());
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request ID
app.use(requestIdMiddleware);

// HTTP request logging with morgan + winston
app.use(httpLogger);

// Subdomain and tenant resolution
app.use(schoolResolverMiddleware);
app.use(tenantMiddleware);

// Cache TTLs (seconds) for low-churn GET endpoints
app.use('/api/config', cacheMiddleware(600));
app.use('/api/website', cacheMiddleware(300));
app.use('/api/dashboard', cacheMiddleware(120));
app.use('/api/reports', cacheMiddleware(300));
app.use('/api/grades', cacheMiddleware(120));
app.use('/api/grade-calculations', cacheMiddleware(120));
app.use('/api/attendance-stats', cacheMiddleware(120));
app.use('/api/fee-calculations', cacheMiddleware(120));
app.use('/api/audit-logs', cacheMiddleware(300));

// Routes — all /api/* handlers; tenant middleware resolves school from subdomain
app.use('/api/config', configRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/website', websiteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/guardians', guardianRoutes);
app.use('/api/academics', academicRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/periods', periodRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/class-subjects', classSubjectRoutes);
app.use('/api/subject-teachers', subjectTeacherRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/grade-calculations', gradeCalculationRoutes);
app.use('/api/attendance-stats', attendanceStatsRoutes);
app.use('/api/fee-calculations', feeCalculationRoutes);
app.use('/api/users/manage', userManagementRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/website', enrolmentRoutes);

// API documentation
app.use('/api-docs', swaggerRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// 404 Handler
app.use((req, res) => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, { reqId: req.reqId });
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Sentry error handler (captures and passes to our handler)
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}

// Global error handler
app.use(errorMiddleware);

module.exports = app;
