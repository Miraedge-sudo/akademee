# Akademee — School Management System Overview

## What We Are Building

Akademee is a complete school management platform designed for Cameroon. It supports all 5 Cameroonian education systems — Anglophone General (GCE), Anglophone Technical, Francophone General (BEPC/Baccalaureate), Francophone Technical (CAP/BEP), and University (LMD).

The platform is used by schools to manage students, classes, grades, report cards, attendance, fees, payments, exams, communications, and their public website — all in one place.

---

## Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Node.js + Express.js + PostgreSQL (Supabase) | API server, business logic, data storage |
| **Frontend** | React 19 + Vite + Tailwind CSS + i18next (EN/FR) | Web application for all user roles |
| **Auth** | JWT tokens + bcrypt | Authentication & authorization |
| **Storage** | Cloudinary | Images (logos, avatars, photos) |

---

## Complete Module Map

Each module below shows:
- **Backend:** routes (API endpoints) and services
- **Frontend:** pages and components
- **Status:** what is done and what is still needed

---

### 1. AUTHENTICATION & ONBOARDING

**Backend routes:** `auth.routes.js` (9 routes), `school.routes.js` (14 routes)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| POST /auth/login | Login with email/password | Done |
| POST /auth/verify-school | Verify school subdomain | Done |
| POST /auth/verify-email | Verify email address | Done |
| POST /auth/forgot-password | Request password reset | Done |
| POST /auth/reset-password | Reset password with token | Done |
| POST /auth/logout | Logout (blacklist token) | Done |
| GET /auth/me | Get current user profile | Done |
| POST /auth/refresh | Refresh JWT token | Done |
| POST /school/register | Register new school | Done |
| GET /school/check-subdomain | Check subdomain availability | Done |
| GET /school/plans | List subscription plans | Done |
| GET /school/templates | List website templates | Done |
| POST /school/verify-email | Resend verification email | Done |
| POST /school/onboarding | Save onboarding data (5 steps) | Done |
| POST /school/onboarding/media | Upload media during onboarding | Done |

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Landing Page | `/` | Done |
| Login | `/login` | Done |
| Register | `/register` | Done |
| Onboarding (5-step wizard) | `/onboarding` | Done |
| Forgot Password | `/forgot-password` | Done |
| Reset Password | `/reset-password` | Done |
| Verify Email | `/verify-email` | Done |
| Education System Selection | `/educational-system-selection` | Done |

**Still needed:**
- 🔲 **OAuth / Social login** (Google, Microsoft)
- 🔲 **2FA / Multi-factor authentication**
- 🔲 **Session management UI** (view active sessions, force logout)
- 🔲 **Account deletion / data export** (GDPR-style)

---

### 2. USERS, ROLES & PERMISSIONS

**Backend routes:** `user.routes.js` (3), `userManagement.routes.js` (5), `role.routes.js` (8)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| GET/POST /users | List and create users | Done |
| GET/PUT/DELETE /users/:id | Get, update, delete user | Done |
| GET /user/profile | Get own profile | Done |
| PUT /user/profile | Update own profile | Done |
| POST /user/change-password | Change password | Done |
| GET/POST /roles | List and create roles | Done |
| GET /roles/permissions | List all permissions | Done |
| POST /roles/:userId/assign | Assign role to user | Done |
| DELETE /roles/:userId/role/:roleCode | Remove role from user | Done |
| GET/POST/DELETE /roles/permissions/:roleCode | Manage role permissions | Done |

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Users List | `/dashboard/users` | Done |
| Create User | `/dashboard/users/create` | Done |
| Teacher-Class Assignment | `/dashboard/teacher-assignments` | Done |

**Still needed:**
- 🔲 **Bulk user import** (CSV/Excel upload)
- 🔲 **User activity log viewer** (see what each user did)
- 🔲 **Role cloning** (duplicate a role with all permissions)

---

### 3. ACADEMIC STRUCTURE

**Backend routes:** `level.routes.js` (5), `series.routes.js` (5), `period.routes.js` (5), `v1/sequence.routes.js` (6), `academic.routes.js` (6), `class.routes.js` (13), `classSubject.routes.js` (5)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| CRUD /levels | Manage grade levels | Done |
| CRUD /series | Manage academic streams/series | Done |
| CRUD /periods | Manage terms, semesters | Done |
| CRUD /v1/sequences | Manage sequences within periods | Done |
| CRUD /years | Manage academic years | Done |
| ACTIVATE /years/:id/activate | Set active academic year | Done |
| CRUD /classes | Manage classes | Done |
| GET /classes/teacher/:teacherId | Get teacher's classes | Done |
| GET /classes/:id/students | List students in a class | Done |
| POST/DELETE /classes/:id/teachers | Assign/remove class teachers | Done |
| CRUD /class-subjects | Assign subjects to classes | Done |
| POST /class-subjects/bulk | Bulk assign subjects | Done |

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Levels | `/dashboard/levels` | Done |
| Series | `/dashboard/series` | Done |
| Periods | `/dashboard/periods` | Done |
| Sequences | `/dashboard/sequences` | Done |
| Classes | `/dashboard/classes` | Done |
| Class Detail | `/dashboard/classes/:id` | Done |
| Academic Years | `/dashboard/academic-years` | Done |
| Subjects List | `/dashboard/subjects` | Done |
| Class Subjects | `/dashboard/subject-classes` | Done |

**Still needed:**
- 🔲 **Visual class timetable / scheduling**
- 🔲 **Class capacity warnings** (notification when class is full)
- 🔲 **Automatic class promotion** (promote all students to next level at year end)
- 🔲 **Split/merge classes** (when a class has too many students)
- 🔲 **Period lock/unlock** (prevent grade entry for closed periods)

---

### 4. STUDENTS & ENROLLMENT

**Backend routes:** `student.routes.js` (6), `enrollment.routes.js` (7), `enrolment.routes.js` (3), `guardian.routes.js` (7)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| CRUD /students | Manage student records | Done |
| GET /student/me | Get own student profile | Done |
| CRUD /enrollments | Enroll students in classes | Done |
| PUT /enrollments/:id/status | Update enrollment status (active, graduated, expelled) | Done |
| POST /enrollments/:id/transfer | Transfer student to another class | Done |
| POST /enrolment/enrol | Public enrollment inquiry | Done |
| GET/POST /enrolment/inquiries | Manage enrollment inquiries | Done |
| PUT /enrolment/inquiries/:id/status | Approve/reject inquiry | Done |
| CRUD /guardians | Manage parent/guardian records | Done |
| GET /guardian/me/children | Get guardian's children | Done |

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Students List | `/dashboard/students` | Done |
| Student Profile | `/dashboard/students/:id` | Done |
| Student Dashboard | `/dashboard/student-home` | Done |
| Admissions Section | `/dashboard/admissions` | Done |
| Parent Dashboard | `/dashboard/parent-home` | Done |

**Still needed:**
- 🔲 **Bulk student import** (CSV/Excel with photo)
- 🔲 **Student ID card generation**
- 🔲 **Birth certificate upload & verification**
- 🔲 **Student medical records** (allergies, conditions, emergency contacts)
- 🔲 **Academic transcript** (full history across all years)
- 🔲 **Discipline records** (warnings, suspensions, commendations)
- 🔲 **Parent-teacher meeting scheduling**
- 🔲 **Multiple guardians per student** (father, mother, other)

---

### 5. GRADES & GRADE ENTRY

**Backend routes:** `grade.routes.js` (10), `gradeCalculation.routes.js` (2)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| CRUD /grades | Manage individual grades | Done |
| GET /grades/class/:classId | Get all grades for a class | Done |
| GET /grades/student/:studentId | Get grades for a student | Done |
| GET /grades/period/:periodId/class/:classId | Get grades by period + class | Done |
| POST /grades/calculate | Trigger grade recalculation | Done |
| GET /grades/report/:studentId | Get report data for a student | Done |
| POST /grades/bulk-upload | Bulk upload grades (Excel) | Done |
| GET /grade-calculation/averages/:studentId | Calculate student averages | Done |
| GET /grade-calculation/rankings/:classId | Calculate class rankings | Done |

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Grade Entry (Teacher) | `/dashboard/grade-entry` | Done |
| Grades Overview | `/dashboard/grades` | Done |
| My Grades (Student) | `/dashboard/my-grades` | Done |

**Still needed:**
- 🔲 **Grade import from CSV/Excel** (with template download)
- 🔲 **Grade validation rules** (max score per component, coefficient limits)
- 🔲 **Grade audit viewer** (who changed what grade and when)
- 🔲 **Grade statistics** (subject pass rate, average trends)
- 🔲 **Anomaly detection** (grades that deviate too far from the mean)

---

### 6. V1 GRADING SYSTEM (Report Cards)

**Backend routes:** `v1/gradingSystem.routes.js` (30+ endpoints)

This is the newest and most sophisticated module, built specifically for Cameroon's education system requirements.

| Feature | Purpose | Status |
|---------|---------|--------|
| Education Systems | 5 seed systems (ANG_GEN, FR_GEN, ANG_TECH, FR_TECH, UNIV) | Done |
| Grading Scales | Create scales with versions (pass mark, rounding rule, precision) | Done |
| Mention Thresholds | Configure "Excellent", "Good", "Satisfactory", "Passable", "Insufficient" | Done |
| Subject Offerings | Link subjects → classes → periods with coefficients | Done |
| Assessment Components | Define CC (40%), Exam (60%), Practical, Theory, Resit components | Done |
| UE Groups | Group subjects for university compensation (LMD system) | Done |
| Grade Entry (v1) | Enter grades per student per assessment component | Done |
| Calculations | Subject average, period average, cohort ranks, class stats | Done |
| Report Card Generation | Single student or entire class | Done |
| Report Card Lifecycle | DRAFT → PUBLISH → LOCK → UNLOCK → REVISE → DELETE | Done |
| Report Card Payload | Full JSON: student info, subjects, averages, ranks, mentions, attendance, min/max/avg | Done |
| Report Card Config | Per-school configuration (signature blocks, field toggles, language mode) | Done |
| Audit Trail | Every grade and report card action is logged | Done |
| Unit Tests | 33 tests for utility functions + CRUD | Done |

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Report Cards (Admin) | `/dashboard/report-cards` | Done |
| Grading Config | `/dashboard/grading-config` | Done |
| Subject Offerings | `/dashboard/subject-offerings` | Done |

**Still needed:**
- 🔲 **Backend: GET /mention-threshold-sets** (missing endpoint)
- 🔲 **Backend: Input validation** (express-validator for all v1 endpoints)
- 🔲 **Backend: PUT/DELETE subject-offerings + assessment-components**
- 🔲 **Backend: Server-side PDF generation** (Puppeteer)
- 🔲 **Backend: Email report cards** (send PDF to parents)
- 🔲 **Backend: Version history** (restore previous versions)
- 🔲 **Backend: Auto-COMPLETE** (transition DRAFT→COMPLETE when all grades entered)
- 🔲 **Frontend: Student/Parent report card view** (view their own report cards)
- 🔲 **Frontend: Server PDF download option**
- 🔲 **Frontend: Print-optimized CSS**
- 🔲 **Frontend: Batch actions** (publish/lock/delete multiple at once)
- 🔲 **Frontend: Batch PDF export as ZIP**
- 🔲 **Frontend: Grade trends charts** (progress across sequences)
- 🔲 **Tests: Integration tests for all v1 endpoints**
- 🔲 **Tests: Frontend component tests**

---

### 7. ATTENDANCE

**Backend routes:** `attendance.routes.js` (9), `attendanceStats.routes.js` (3)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| POST /attendance | Record single attendance | Done |
| POST /attendance/bulk | Bulk record attendance | Done |
| POST /attendance/bulk-record | Alternative bulk record | Done |
| GET /attendance/student/:studentId | Get student attendance history | Done |
| GET /attendance/class/:classId/date/:date | Get class attendance for a date | Done |
| GET /attendance/class/:classId | Get class attendance history | Done |
| PUT /attendance/:id | Update attendance record | Done |
| GET /attendance-stats/student/:studentId | Student stats (present, absent, late) | Done |
| GET /attendance-stats/class/:classId | Class stats | Done |
| GET /attendance-stats/trends/monthly | Monthly trends | Done |

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Attendance Entry | `/dashboard/attendance` | Done |
| My Attendance (Student) | `/dashboard/my-attendance` | Done |

**Still needed:**
- 🔲 **QR code attendance** (scan to mark present)
- 🔲 **Attendance dashboard** (charts, trends, alerts)
- 🔲 **Automated SMS/email for absences**
- 🔲 **Daily attendance report** (PDF summary for head teacher)
- 🔲 **Late arrival tracking** (time of arrival)
- 🔲 **Attendance per subject/period** (not just daily)

---

### 8. FINANCE (Fees & Payments)

**Backend routes:** `finance.routes.js` (8), `feeCalculation.routes.js` (5), `payment.routes.js` (6)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| CRUD /finance/fees | Manage fee types | Done |
| POST /finance/fees/assign | Assign fees to classes | Done |
| GET /finance/student/:studentId | Get student fee breakdown | Done |
| GET /finance/reports | Finance reports | Done |
| POST /fee-calculation/recalculate | Recalculate fee statuses | Done |
| GET /fee-calculation/student/:studentId/summary | Student fee summary | Done |
| GET /fee-calculation/student/:studentId/fees | Student assigned fees | Done |
| GET /fee-calculation/class/:classId/assigned-fees | Class assigned fees | Done |
| POST /payments | Record payment | Done |
| GET /payments/student/:studentId | Get student payments | Done |
| POST /payments/confirm | Confirm payment (duplicate check) | Done |
| POST /payments/report/generate | Generate payment report | Done |

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Fees Management | `/dashboard/fees` | Done |
| Fees Assignment | `/dashboard/fees/assign` | Done |
| Payments | `/dashboard/payments` | Done |
| Receipts (with PDF) | `/dashboard/receipts` | Done |
| Finance Dashboard | `/dashboard/finance` | Done |
| My Fees (Student) | `/dashboard/my-fees` | Done |
| Accountant Dashboard | `/dashboard/accountant-home` | Done |

**Still needed:**
- 🔲 **Mobile money integration** (MTN MoMo, Orange Money, YUP, Moov Money)
- 🔲 **Bank payment integration**
- 🔲 **Automatic late fee calculation** (penalties)
- 🔲 **Payment reminders** (SMS, email, in-app)
- 🔲 **Scholarship/discount management**
- 🔲 **Payment plan / installment scheduling**
- 🔲 **Invoice generation** (PDF invoices)
- 🔲 **Bank reconciliation** (upload bank statement)
- 🔲 **Debt collection reports**
- 🔲 **Financial year closing**

---

### 9. EXAMS

**Backend routes:** `exam.routes.js` (8)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| CRUD /exams | Manage official exams (GCE, BEPC, Baccalaureate) | Done |
| POST /exams/:examId/register | Register student for exam | Done |
| GET /exams/:examId/registrations | List registrations for an exam | Done |
| PUT /exams/registrations/:id/result | Record exam result | Done |

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Exams Section | `/dashboard/exams/*` | Done |

**Still needed:**
- 🔲 **Exam timetable** (schedule and venue)
- 🔲 **Exam center allocation** (for inter-school exams)
- 🔲 **Result publication portal** (students check online)
- 🔲 **GCE specific: candidate number generation**
- 🔲 **Transcript generation** (official academic transcript)

---

### 10. COMMUNICATION

**Backend routes:** `announcement.routes.js` (8), `notification.routes.js` (5)

| Feature | Purpose | Status |
|---------|---------|--------|
| Announcements CRUD | Create and manage announcements | Done |
| Announcements publish/unpublish | Control visibility | Done |
| Public announcements | View published announcements on school website | Done |
| Notifications CRUD | In-app notifications | Done |
| Notification read/unread | Mark as read, count unread | Done |
| Send notification | Direct notification to users | Done |

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Announcements (Admin) | `/dashboard/announcements` | Done |

**Still needed:**
- 🔲 **SMS integration** (send SMS for urgent announcements)
- 🔲 **Email campaign** (send to selected groups)
- 🔲 **Push notifications** (mobile app)
- 🔲 **Targeted announcements** (by class, level, role)
- 🔲 **Announcement scheduling** (set publish date in future)
- 🔲 **Read receipts** (who has seen the announcement)
- 🔲 **Communication templates**

---

### 11. WEBSITE & PUBLIC PRESENCE

**Backend routes:** `website.routes.js` (3), `config.routes.js` (3)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| GET /website/public/:subdomain | Get public school website data | Done |
| GET /website/data | Get website content for editing | Done |
| POST /website/template/update | Update website template/content | Done |
| GET /config | Get system configuration | Done |
| GET /config/domains | Get domain configuration | Done |
| GET /config/tenant | Get tenant configuration | Done |

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Public School Website | `/` (per subdomain) | Done |
| Website Settings | `/dashboard/website` | Done |

**Still needed:**
- 🔲 **Website template builder** (drag & drop editor)
- 🔲 **SEO optimization** (meta tags, sitemap)
- 🔲 **Blog / news module**
- 🔲 **Photo gallery with albums**
- 🔲 **Contact form with spam protection**
- 🔲 **Custom domain support** (school.akademee.com → school.com)
- 🔲 **Online admission application**

---

### 12. TEACHER MODULE

**Backend routes:** `subjectTeacher.routes.js` (5), `classTeacher.routes.js` (5), `class.routes.js` (teacher endpoints)

| Feature | Purpose | Status |
|---------|---------|--------|
| Subject-Teacher assignment | Assign teachers to subjects | Done |
| Class-Teacher assignment | Assign head teachers to classes | Done |
| Get teacher's classes | List classes assigned to a teacher | Done |
| Get teacher's subjects | List subjects assigned to a teacher | Done |
| Get available teachers | Find teachers not yet assigned | Done |

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Teacher Dashboard | `/dashboard/teacher-home` | Done |
| Teachers List | `/dashboard/teachers` | Done |
| My Classes | `/dashboard/my-classes` | Done |
| Grade Entry | `/dashboard/grade-entry` | Done |

**Still needed:**
- 🔲 **Teacher schedule / timetable view**
- 🔲 **Teacher lesson notes / lesson plans**
- 🔲 **Teacher performance evaluation**
- 🔲 **Leave management (sick leave, permission)**
- 🔲 **Salary / payroll management**

---

### 13. DASHBOARDS & REPORTING

**Backend routes:** `dashboard.routes.js` (4), `report.routes.js` (8), `audit.routes.js` (1)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| GET /dashboard/stats | Summary statistics | Done |
| GET /dashboard/activities | Recent activities | Done |
| GET /dashboard/revenue | Revenue data | Done |
| GET /dashboard/finance-stats | Finance statistics | Done |
| GET /reports/bulletin/:studentId/:periodId | Legacy bulletin generation | Done |
| GET /reports/bulletin/:id/download | Legacy bulletin PDF download | Done |
| GET /reports/class/:classId/:periodId | Class report | Done |
| GET /reports/performance/:studentId | Student performance report | Done |
| GET /reports/export/:reportId | Export report | Done |
| GET /audit | Audit log list | Done |

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Admin Dashboard | `/dashboard` | Done |
| Accountant Dashboard | `/dashboard/accountant-home` | Done |

**Still needed:**
- 🔲 **Custom report builder** (select fields, filters, export format)
- 🔲 **Scheduled reports** (auto-generated PDFs sent to email)
- 🔲 **Data export dashboard** (one-click export of any data set)
- 🔲 **Charts & analytics dashboard** (enrollment trends, fee collection rates, grade distributions)
- 🔲 **School performance dashboard** (compare across years)
- 🔲 **Teacher performance analytics**

---

### 14. SETTINGS & CONFIGURATION

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Settings | `/dashboard/settings` | Done |
| Academic Years | `/dashboard/academic-years` | Done |
| System Configuration | `/dashboard/system-configuration` | Done |
| Website Settings | `/dashboard/website` | Done |

**Still needed:**
- 🔲 **Backup & restore** (database backup, export all data)
- 🔲 **System logs viewer** (server logs in dashboard)
- 🔲 **Feature flags** (enable/disable modules per school)
- 🔲 **Data retention policy** (auto-delete old data)
- 🔲 **Bulk operations** (archive, export, delete)

---

### 15. PROGRAMS, FACULTIES & RESEARCH (University)

**Backend routes:** (via level.routes.js, series.routes.js, subject.routes.js)

**Frontend pages:**

| Page | Route | Status |
|------|-------|--------|
| Programs Section | `/dashboard/programs/*` | Done |
| Faculties | `/dashboard/faculties` | Done |
| Departments | `/dashboard/departments` | Done |
| Research | `/dashboard/research/*` | Done |
| Publications | `/dashboard/publications` | Done |

**Still needed:**
- 🔲 **Full LMD curriculum management**
- 🔲 **Course catalog** (with descriptions, prerequisites, credits)
- 🔲 **Semester registration** (course selection)
- 🔲 **UE group validation** (ensure all requirements met for graduation)
- 🔲 **Transcript generation** (official LMD transcript)

---

### 16. MEDIA & FILE MANAGEMENT

**Backend:** `media.service.js`

| Feature | Purpose | Status |
|---------|---------|--------|
| Cloudinary upload | Upload images to Cloudinary | Done |
| Avatar upload | User profile photos | Done |
| School media | Logo, gallery photos | Done |
| Announcement files | File attachments to announcements | Done |

**Still needed:**
- 🔲 **File uploads for any entity** (student documents, fee receipts, certificates)
- 🔲 **Document verification** (check document authenticity)
- 🔲 **Bulk photo upload** (class photos)

---

### 17. INVITES

**Backend routes:** `invite.routes.js` (4)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| POST /invites/send | Send invitation to join school | Done |
| GET /invites/validate/:token | Validate invitation token | Done |
| POST /invites/accept | Accept invitation | Done |
| POST /invites/decline | Decline invitation | Done |

**Done.** No major improvements identified.

---

### 18. SWAGGER / API DOCUMENTATION

**Backend routes:** `swagger.routes.js` (2)

| Endpoint | Purpose | Status |
|----------|---------|--------|
| GET /api-docs | Swagger UI | Done |
| GET /api-docs/spec.json | OpenAPI specification | Done |

**Still needed:**
- 🔲 **Complete Swagger annotations** for all v1 grading endpoints
- 🔲 **API examples** for common operations

---

## What Remains: Complete List Across ALL Modules

### High Priority

| Module | Feature | Reason |
|--------|---------|--------|
| **Grading v1 (Backend)** | GET /mention-threshold-sets endpoint | Frontend cannot persist threshold sets on page refresh |
| **Grading v1 (Backend)** | Input validation (express-validator) | Data integrity and security |
| **Grading v1 (Backend)** | PUT/DELETE for subject-offerings + assessment-components | Users cannot fix mistakes |
| **Grading v1 (Frontend)** | Student/Parent report card view | End-users need to access their report cards |
| **Grading v1 (Backend)** | Server-side PDF generation (Puppeteer) | Reliable, high-quality PDF exports |
| **Finance** | Mobile money integration (MTN MoMo, Orange Money) | Most common payment method in Cameroon |
| **Attendance** | QR code attendance | Faster attendance tracking for large classes |
| **Communication** | SMS integration | Urgent notifications to parents without smartphones |

### Medium Priority

| Module | Feature |
|--------|---------|
| **Grading v1** | Report card version history |
| **Grading v1** | Auto-transition DRAFT → COMPLETE |
| **Grading v1** | Email report cards to parents |
| **Grading v1** | Batch PDF export as ZIP |
| **Grading v1** | Grade trends charts across sequences |
| **Grading v1** | Integration tests for all endpoints |
| **Finance** | Payment reminders (SMS/email) |
| **Finance** | Scholarship/discount management |
| **Finance** | Invoice generation (PDF) |
| **Students** | Bulk import (CSV/Excel) |
| **Students** | ID card generation |
| **Students** | Discipline records |
| **Attendance** | Per-subject attendance |
| **Attendance** | Daily PDF report for head teacher |
| **Teachers** | Lesson notes / lesson plans |
| **Teachers** | Leave management |
| **Website** | Contact form with spam protection |
| **Website** | Custom domain support |
| **Exams** | Result publication portal for students |
| **Auth** | Account deletion / data export |
| **Settings** | Backup & restore UI |
| **Settings** | System logs viewer |
| **Settings** | Feature flags |

### Low Priority / Future

| Module | Feature |
|--------|---------|
| **Auth** | OAuth / Social login |
| **Auth** | 2FA / Multi-factor authentication |
| **Finance** | Bank reconciliation |
| **Finance** | Financial year closing |
| **Students** | Medical records |
| **Students** | Parent-teacher meeting scheduling |
| **Academic** | Visual class timetable |
| **Academic** | Automatic class promotion |
| **Communication** | Push notifications (mobile) |
| **Website** | Blog / news module |
| **Website** | Drag & drop template builder |
| **Website** | Online admission application |
| **Teachers** | Salary / payroll management |
| **Teachers** | Performance evaluation |
| **Reports** | Custom report builder |
| **Reports** | Scheduled auto-generated reports |
| **Reports** | School performance comparison dashboard |
| **API** | Complete Swagger annotations |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Backend route files** | 37 |
| **Backend API endpoints** | ~220 total |
| **Backend services** | 38 |
| **Database migrations** | 40+ |
| **Frontend pages** | 55+ |
| **Framework** | React 19 + Vite + Tailwind CSS |
| **i18n** | English + French |
| **Auth** | JWT with bcrypt |
| **Database** | PostgreSQL (Supabase) |
| **File storage** | Cloudinary |
| **PDF generation** | html2canvas + jsPDF (client) / Puppeteer planned (server) |

## Conclusion

The core of Akademee is **complete and operational** — authentication, academic structure, grade entry, report cards, attendance, finance, announcements, and the public website all work. The v1 grading system (report cards with full Cameroon standards) is the most sophisticated module at approximately **85% completion**.

The main work ahead is:
1. **Finish missing CRUD endpoints** for the v1 grading system
2. **Add mobile money** for payments (critical for Cameroon)
3. **Build the student/parent portal** for report cards
4. **Add server-side PDF generation** for reliable exports
5. **Improve communication** (SMS, email notifications)
6. **Polish the UI** (loading states, empty states, error handling)

This represents roughly **20-25% additional work** to reach a complete, production-ready platform.
