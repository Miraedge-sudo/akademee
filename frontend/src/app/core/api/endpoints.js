export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/api/auth/login",
    VERIFY_SCHOOL: "/api/auth/verify-school",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
    EXCHANGE: "/api/auth/exchange",
    REFRESH: "/api/auth/refresh",
    VERIFY_EMAIL: "/api/auth/verify-email",
  },

  // Schools
  SCHOOLS: {
    REGISTER: "/api/schools/register",
    CHECK_SUBDOMAIN: "/api/schools/check-subdomain",
    PLANS: "/api/schools/plans",
    TEMPLATES: "/api/schools/templates",
    VERIFY_EMAIL: "/api/schools/verify-email",
    RESEND_VERIFICATION: "/api/schools/resend-verification",
    RESEND_VERIFICATION_REQUEST: "/api/schools/resend-verification-request",
    ONBOARDING: "/api/schools/onboarding",
    ONBOARDING_MEDIA: "/api/schools/onboarding/media",
    LIST: "/api/schools",
    CREATE: "/api/schools",
    GET: (id) => `/api/schools/${id}`,
    UPDATE: (id) => `/api/schools/${id}`,
  },

  // Website public (site vitrine)
  WEBSITE: {
    PUBLIC: "/api/website/public",
    DATA: "/api/website/data",
    TEMPLATE_UPDATE: "/api/website/template/update",
    ENROL: "/api/website/enrol",
    INQUIRIES: "/api/website/inquiries",
    INQUIRY_STATUS: (id) => `/api/website/inquiries/${id}/status`,
  },

  // Students
  STUDENTS: {
    LIST: "/api/students",
    CREATE: "/api/students",
    GET: (id) => `/api/students/${id}`,
    UPDATE: (id) => `/api/students/${id}`,
    DELETE: (id) => `/api/students/${id}`,
  },

  // Guardians
  GUARDIANS: {
    LIST: "/api/guardians",
    CREATE: "/api/guardians",
    GET: (id) => `/api/guardians/${id}`,
    UPDATE: (id) => `/api/guardians/${id}`,
  },

  // Academic
  ACADEMIC: {
    YEARS: "/api/academics/years",
    YEAR: (id) => `/api/academics/years/${id}`,
    ACTIVATE_YEAR: (id) => `/api/academics/years/${id}/activate`,
    PERIODS: "/api/periods",
    PERIOD: (id) => `/api/periods/${id}`,
    CLASSES: "/api/classes",
    CLASS: (id) => `/api/classes/${id}`,
    CLASS_STUDENTS: (id) => `/api/classes/${id}/students`,
    CLASS_STUDENT: (classId, studentId) => `/api/classes/${classId}/students/${studentId}`,
    SUBJECTS: "/api/subjects",
    CLASS_SUBJECTS: "/api/class-subjects",
    CLASS_SUBJECTS_BY_CLASS: (classId) => `/api/class-subjects/class/${classId}`,
  },

  // Subjects
  SUBJECTS: {
    LIST: "/api/subjects",
    CREATE: "/api/subjects",
    GET: (id) => `/api/subjects/${id}`,
    UPDATE: (id) => `/api/subjects/${id}`,
    DELETE: (id) => `/api/subjects/${id}`,
    CLASS: (classId) => `/api/subjects/class/${classId}`,
  },

  // Subject-Teachers assignments
  SUBJECT_TEACHERS: {
    LIST: "/api/subject-teachers",
    ASSIGN: "/api/subject-teachers",
    BY_SUBJECT: (subjectId) => `/api/subject-teachers/subject/${subjectId}`,
    BY_TEACHER: (teacherId) => `/api/subject-teachers/teacher/${teacherId}`,
    DELETE: (id) => `/api/subject-teachers/${id}`,
  },

  // User Management (Teachers & Staff)
  USERS_MANAGE: {
    LIST: "/api/users/manage",
    CREATE: "/api/users/manage",
    GET: (id) => `/api/users/manage/${id}`,
    UPDATE: (id) => `/api/users/manage/${id}`,
    DELETE: (id) => `/api/users/manage/${id}`,
  },

  // Roles
  ROLES: {
    LIST: "/api/roles",
    PERMISSIONS: "/api/roles/permissions",
    USER_ROLES: (userId) => `/api/roles/${userId}`,
    ASSIGN: (userId) => `/api/roles/${userId}/assign`,
    REMOVE: (userId, roleCode) => `/api/roles/${userId}/role/${roleCode}`,
  },

  // Grades
  GRADES: {
    LIST: "/api/grades",
    CREATE: "/api/grades",
    STUDENT: (id) => `/api/grades/student/${id}`,
    CLASS: (classId) => `/api/grades/class/${classId}`,
    PERIOD_CLASS: (periodId, classId) => `/api/grades/period/${periodId}/class/${classId}`,
    REPORT: (studentId) => `/api/grades/report/${studentId}`,
    CALCULATE: "/api/grades/calculate",
    UPDATE: (id) => `/api/grades/${id}`,
    DELETE: (id) => `/api/grades/${id}`,
    BULK_UPLOAD: "/api/grades/bulk-upload",
  },

  // Grade Calculations
  GRADE_CALCULATIONS: {
    AVERAGES: (studentId) => `/api/grade-calculations/averages/${studentId}`,
    RANKINGS: (classId) => `/api/grade-calculations/rankings/${classId}`,
  },

  // Attendance
  ATTENDANCE: {
    LIST: "/api/attendance",
    CREATE: "/api/attendance",
    STUDENT: (id) => `/api/attendance/student/${id}`,
    CLASS_DATE: (classId, date) => `/api/attendance/class/${classId}/date/${date}`,
    CLASS: (classId) => `/api/attendance/class/${classId}`,
    STATISTICS: "/api/attendance/statistics",
    UPDATE: (id) => `/api/attendance/${id}`,
    BULK: "/api/attendance/bulk",
  },

  // Attendance Stats
  ATTENDANCE_STATS: {
    STUDENT: (studentId) => `/api/attendance-stats/student/${studentId}`,
    CLASS: (classId) => `/api/attendance-stats/class/${classId}`,
    MONTHLY_TRENDS: "/api/attendance-stats/trends/monthly",
  },

  // Finance
  FINANCE: {
    FEES: "/api/finance/fees",
    FEE: (id) => `/api/finance/fees/${id}`,
    ASSIGN_FEES: "/api/finance/fees/assign",
    STUDENT_FEE_STATUS: (studentId) => `/api/finance/student/${studentId}`,
    REPORTS: "/api/finance/reports",
  },

  // Payments
  PAYMENTS: {
    LIST: "/api/payments",
    CREATE: "/api/payments",
    GET: (id) => `/api/payments/${id}`,
    STUDENT: (studentId) => `/api/payments/student/${studentId}`,
    VERIFY: (id) => `/api/payments/${id}/verify`,
    REPORT: "/api/payments/report/generate",
  },

  // Enrollments
  ENROLLMENTS: {
    LIST: "/api/enrollments",
    CREATE: "/api/enrollments",
    GET: (id) => `/api/enrollments/${id}`,
    BY_STUDENT: (studentId) => `/api/enrollments/student/${studentId}`,
    UPDATE_STATUS: (id) => `/api/enrollments/${id}/status`,
    TRANSFER: (id) => `/api/enrollments/${id}/transfer`,
    DELETE: (id) => `/api/enrollments/${id}`,
  },

  // Fee Calculations
  FEE_CALCULATIONS: {
    RECALCULATE: "/api/fee-calculations/recalculate",
    STUDENT_STATUS: (studentId) => `/api/fee-calculations/student/${studentId}`,
    STUDENT_SUMMARY: (studentId) => `/api/fee-calculations/student/${studentId}/summary`,
  },

  // Reports
  REPORTS: {
    BULLETIN: (studentId, periodId) => `/api/reports/bulletin/${studentId}/${periodId}`,
    BULLETIN_SIMPLE: (id) => `/api/reports/bulletin/${id}`,
    BULLETIN_DOWNLOAD: (studentId, periodId) => `/api/reports/bulletin/${studentId}/${periodId}/download`,
    CLASS: (classId, periodId) => `/api/reports/class/${classId}/${periodId}`,
    CLASS_SIMPLE: (id) => `/api/reports/class/${id}`,
    PERFORMANCE: (studentId) => `/api/reports/performance/${studentId}`,
    EXPORT: (reportId) => `/api/reports/export/${reportId}`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: "/api/notifications",
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    DELETE: (id) => `/api/notifications/${id}`,
    UNREAD_COUNT: "/api/notifications/unread/count",
    SEND: "/api/notifications/send",
  },

  // Class-Teachers
  CLASS_TEACHERS: {
    LIST_ALL: "/api/classes/teachers",
    BY_CLASS: (classId) => `/api/classes/${classId}/teachers`,
    ASSIGN: (classId) => `/api/classes/${classId}/teachers`,
    REMOVE: (classId, teacherId) => `/api/classes/${classId}/teachers/${teacherId}`,
    AVAILABLE: "/api/classes/teachers/available",
  },

  // Announcements
  ANNOUNCEMENTS: {
    LIST: "/api/announcements",
    CREATE: "/api/announcements",
    GET: (id) => `/api/announcements/${id}`,
    UPDATE: (id) => `/api/announcements/${id}`,
    DELETE: (id) => `/api/announcements/${id}`,
    PUBLISH: (id) => `/api/announcements/${id}/publish`,
    UNPUBLISH: (id) => `/api/announcements/${id}/unpublish`,
    PUBLIC: "/api/announcements/public",
  },

  // Config
  CONFIG: "/api/config",

  // Dashboard
  DASHBOARD: {
    STATS: "/api/dashboard/stats",
    RECENT_ACTIVITIES: "/api/dashboard/activities",
    REVENUE: "/api/dashboard/revenue",
  },

  // Levels & Series
  LEVELS: {
    LIST: "/api/levels",
    GET: (id) => `/api/levels/${id}`,
    CREATE: "/api/levels",
    UPDATE: (id) => `/api/levels/${id}`,
    DELETE: (id) => `/api/levels/${id}`,
  },
  SERIES: {
    LIST: "/api/series",
    GET: (id) => `/api/series/${id}`,
    CREATE: "/api/series",
    UPDATE: (id) => `/api/series/${id}`,
    DELETE: (id) => `/api/series/${id}`,
  },

  // V1 API (sekouh backend)
  V1: {
    PERIODES: "/api/v1/periodes",
    SEQUENCES: "/api/v1/sequences",
    SEQUENCE: (id) => `/api/v1/sequences/${id}`,
    SEQUENCES_BY_PERIODE: (periodeId) => `/api/v1/sequences/periode/${periodeId}`,
    SEQUENCE_OPEN: (id) => `/api/v1/sequences/${id}/open`,
    SEQUENCE_CLOSE: (id) => `/api/v1/sequences/${id}/close`,
    SEQUENCE_LOCK: (id) => `/api/v1/sequences/${id}/lock`,
    SEQUENCE_UNLOCK: (id) => `/api/v1/sequences/${id}/unlock`,
  },
};

export default API_ENDPOINTS;
