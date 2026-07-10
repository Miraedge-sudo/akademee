export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: "/api/auth/login",
    VERIFY_SCHOOL: "/api/auth/verify-school",
    FORGOT_PASSWORD: "/api/auth/forgot-password",
    RESET_PASSWORD: "/api/auth/reset-password",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
  },

  // Schools
  SCHOOLS: {
    REGISTER: "/api/schools/register",
    CHECK_SUBDOMAIN: "/api/schools/check-subdomain",
    PLANS: "/api/schools/plans",
    TEMPLATES: "/api/schools/templates",
    VERIFY_EMAIL: "/api/schools/verify-email",
    RESEND_VERIFICATION: "/api/schools/resend-verification",
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
    CLASSES: "/api/classes",
    CLASS: (id) => `/api/classes/${id}`,
    CLASS_STUDENTS: (id) => `/api/classes/${id}/students`,
    CLASS_STUDENT: (classId, studentId) => `/api/classes/${classId}/students/${studentId}`,
    SUBJECTS: "/api/subjects",
    CLASS_SUBJECTS: "/api/class-subjects",
    CLASS_SUBJECTS_BY_CLASS: (classId) => `/api/class-subjects/class/${classId}`,
  },

  // Grades
  GRADES: {
    LIST: "/api/grades",
    CREATE: "/api/grades",
    STUDENT: (id) => `/api/grades/student/${id}`,
    UPDATE: (id) => `/api/grades/${id}`,
  },

  // Attendance
  ATTENDANCE: {
    LIST: "/api/attendance",
    CREATE: "/api/attendance",
    STUDENT: (id) => `/api/attendance/student/${id}`,
  },

  // Finance
  FINANCE: {
    FEES: "/api/finance/fees",
    PAYMENTS: "/api/payments",
    PAYMENT: (id) => `/api/payments/${id}`,
  },

  // Reports
  REPORTS: {
    BULLETIN: (id) => `/api/reports/bulletin/${id}`,
    CLASS: (id) => `/api/reports/class/${id}`,
  },

  // Notifications
  NOTIFICATIONS: {
    LIST: "/api/notifications",
    MARK_READ: (id) => `/api/notifications/${id}/read`,
    DELETE: (id) => `/api/notifications/${id}`,
    UNREAD_COUNT: "/api/notifications/unread/count",
    SEND: "/api/notifications/send",
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
  },

  // Config
  CONFIG: "/api/config",

  // Dashboard
  DASHBOARD: {
    STATS: "/api/dashboard/stats",
    RECENT_ACTIVITIES: "/api/dashboard/activities",
    REVENUE: "/api/dashboard/revenue",
  },
};

export default API_ENDPOINTS;
