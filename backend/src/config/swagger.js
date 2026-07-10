const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Akademee API',
      version: '1.0.0',
      description: 'School Management System REST API',
      contact: {
        name: 'Akademee Support',
        email: 'support@akademee.app',
      },
    },
    servers: [
      {
        url: 'http://localhost:1000',
        description: 'Development server',
      },
      {
        url: 'https://api.akademee.cm',
        description: 'Production server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & session management' },
      { name: 'Schools', description: 'School registration & onboarding' },
      { name: 'Website', description: 'Public website template & content' },
      { name: 'Users', description: 'User profile & password management' },
      { name: 'Students', description: 'Student management' },
      { name: 'Guardians', description: 'Guardian/parent management' },
      { name: 'Academics', description: 'Academic years & terms' },
      { name: 'Classes', description: 'Class management & enrollment' },
      { name: 'Subjects', description: 'Subject management' },
      { name: 'Grades', description: 'Student grades & grade scales' },
      { name: 'Attendance', description: 'Attendance tracking & statistics' },
      { name: 'Finance', description: 'Fee structures & assignments' },
      { name: 'Payments', description: 'Payment processing & history' },
      { name: 'Exams', description: 'Exam management & registration' },
      { name: 'Reports', description: 'Report cards & class reports' },
      { name: 'Notifications', description: 'Push notifications & preferences' },
      { name: 'Announcements', description: 'School announcements' },
      { name: 'Periods', description: 'Academic periods & terms' },
      { name: 'Enrollments', description: 'Student enrollment & transfers' },
      { name: 'Dashboard', description: 'Dashboard statistics & charts' },
      { name: 'User Management', description: 'Admin user CRUD' },
      { name: 'Roles', description: 'Role & permission management' },
      { name: 'Audit', description: 'Audit log retrieval' },
      { name: 'Config', description: 'Application configuration' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            reqId: { type: 'string', format: 'uuid' },
            details: { type: 'object' },
            stack: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 42 },
            limit: { type: 'integer', example: 50 },
            offset: { type: 'integer', example: 0 },
          },
        },
        School: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            subdomain: { type: 'string' },
            email: { type: 'string', format: 'email' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            schoolId: { type: 'string', format: 'uuid' },
            roles: { type: 'array', items: { type: 'string' } },
          },
        },
        Student: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            className: { type: 'string' },
            classId: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['active', 'inactive', 'graduated', 'transferred', 'suspended'] },
          },
        },
        Class: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            classTeacherId: { type: 'string', format: 'uuid' },
            academicYearId: { type: 'string', format: 'uuid' },
            capacity: { type: 'integer' },
            studentCount: { type: 'integer' },
          },
        },
        Subject: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            code: { type: 'string' },
            coefficient: { type: 'number' },
          },
        },
        Grade: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
            subjectId: { type: 'string', format: 'uuid' },
            classId: { type: 'string', format: 'uuid' },
            periodId: { type: 'string', format: 'uuid' },
            score: { type: 'number' },
            grade: { type: 'string' },
            coefficient: { type: 'number' },
          },
        },
        Attendance: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
            classId: { type: 'string', format: 'uuid' },
            date: { type: 'string', format: 'date' },
            status: { type: 'string', enum: ['present', 'absent', 'late', 'excused'] },
            remarks: { type: 'string' },
          },
        },
        Fee: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            amount: { type: 'number' },
            classId: { type: 'string', format: 'uuid' },
            description: { type: 'string' },
          },
        },
        Exam: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            examType: { type: 'string' },
            academicYearId: { type: 'string', format: 'uuid' },
            fee: { type: 'number' },
            maxCandidates: { type: 'integer' },
          },
        },
        Period: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['term', 'semester', 'quarter'] },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            isCurrent: { type: 'boolean' },
          },
        },
        Announcement: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            content: { type: 'string' },
            audience: { type: 'string', enum: ['all', 'students', 'teachers', 'parents'] },
            isPublished: { type: 'boolean' },
            publishedAt: { type: 'string', format: 'date-time' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string' },
            title: { type: 'string' },
            message: { type: 'string' },
            isRead: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Payment: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            studentId: { type: 'string', format: 'uuid' },
            amount: { type: 'number' },
            method: { type: 'string' },
            reference: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
