// PostgreSQL Query Models - Enterprise Schema
const sql = require('../config/db');

// ============================================================
// USER MANAGEMENT QUERIES
// ============================================================

const User = {
  findByEmail: (email, schoolId = null) => {
    if (schoolId) {
      return sql`SELECT * FROM users WHERE email = ${email} AND school_id = ${schoolId}`;
    }
    return sql`SELECT * FROM users WHERE email = ${email}`;
  },
  
  findById: (userId) => sql`SELECT * FROM users WHERE user_id = ${userId}`,
  
  findBySchool: (schoolId) => sql`SELECT * FROM users WHERE school_id = ${schoolId} ORDER BY created_at DESC`,
  
  create: (data) => sql`
    INSERT INTO users (school_id, first_name, last_name, email, password_hash, phone, is_active)
    VALUES (${data.schoolId}, ${data.firstName}, ${data.lastName}, ${data.email}, ${data.passwordHash}, ${data.phone || null}, true)
    RETURNING user_id, first_name, last_name, email, is_active
  `,
  
  update: (userId, data) => sql`
    UPDATE users
    SET first_name = ${data.firstName || sql`first_name`},
        last_name = ${data.lastName || sql`last_name`},
        phone = ${data.phone || sql`phone`},
        avatar_url = ${data.avatarUrl || sql`avatar_url`},
        updated_at = CURRENT_TIMESTAMP
    WHERE user_id = ${userId}
    RETURNING *
  `,

  getRoles: (userId) => sql`
    SELECT r.role_id, r.role_name, r.role_code
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.role_id
    WHERE ur.user_id = ${userId}
  `,

  assignRole: (userId, roleId, assignedBy = null) => sql`
    INSERT INTO user_roles (user_id, role_id, assigned_by)
    VALUES (${userId}, ${roleId}, ${assignedBy})
    ON CONFLICT (user_id, role_id) DO NOTHING
    RETURNING *
  `,

  removeRole: (userId, roleId) => sql`
    DELETE FROM user_roles 
    WHERE user_id = ${userId} AND role_id = ${roleId}
  `,
};

// Role queries
const Role = {
  list: () => sql`SELECT * FROM roles ORDER BY role_id`,
  findByCode: (roleCode) => sql`SELECT * FROM roles WHERE role_code = ${roleCode}`,
  findById: (roleId) => sql`SELECT * FROM roles WHERE role_id = ${roleId}`,
};

// ============================================================
// SCHOOL QUERIES
// ============================================================

const School = {
  list: () => sql`SELECT * FROM schools WHERE is_active = true ORDER BY created_at DESC`,
  
  findById: (schoolId) => sql`SELECT * FROM schools WHERE school_id = ${schoolId}`,
  
  findBySubdomain: (subdomain) => sql`SELECT * FROM schools WHERE subdomain = ${subdomain}`,
  
  create: (data) => sql`
    INSERT INTO schools (name, subdomain, email, phone, address, city, region, academic_system, subscription_plan)
    VALUES (${data.name}, ${data.subdomain}, ${data.email}, ${data.phone || null}, 
            ${data.address || null}, ${data.city || null}, ${data.region || null}, 
            ${data.academicSystem || 'TERM_SEQUENCE'}, ${data.subscriptionPlan || 'free'})
    RETURNING *
  `,
  
  update: (schoolId, data) => sql`
    UPDATE schools
    SET name = ${data.name || sql`name`},
        email = ${data.email || sql`email`},
        phone = ${data.phone || sql`phone`},
        address = ${data.address || sql`address`},
        city = ${data.city || sql`city`},
        region = ${data.region || sql`region`},
        subscription_plan = ${data.subscriptionPlan || sql`subscription_plan`},
        updated_at = CURRENT_TIMESTAMP
    WHERE school_id = ${schoolId}
    RETURNING *
  `,
};

// ============================================================
// STUDENT & GUARDIAN QUERIES
// ============================================================

const Student = {
  list: (schoolId) => sql`
    SELECT * FROM students 
    WHERE school_id = ${schoolId} AND status = 'active'
    ORDER BY created_at DESC
  `,
  
  findById: (studentId) => sql`SELECT * FROM students WHERE student_id = ${studentId}`,
  
  findByNumber: (studentNumber, schoolId) => sql`
    SELECT * FROM students 
    WHERE student_number = ${studentNumber} AND school_id = ${schoolId}
  `,
  
  create: (data) => sql`
    INSERT INTO students (school_id, user_id, student_number, registration_number, 
                         date_of_birth, place_of_birth, gender, nationality, religion, 
                         blood_group, medical_notes, photo_url, status, enrollment_type)
    VALUES (${data.schoolId}, ${data.userId}, ${data.studentNumber}, ${data.registrationNumber},
            ${data.dateOfBirth || null}, ${data.placeOfBirth || null}, ${data.gender || 'male'},
            ${data.nationality || null}, ${data.religion || null}, ${data.bloodGroup || null},
            ${data.medicalNotes || null}, ${data.photoUrl || null}, 'active', ${data.enrollmentType || 'new'})
    RETURNING *
  `,
  
  update: (studentId, data) => sql`
    UPDATE students
    SET gender = ${data.gender || sql`gender`},
        nationality = ${data.nationality || sql`nationality`},
        religion = ${data.religion || sql`religion`},
        blood_group = ${data.bloodGroup || sql`blood_group`},
        medical_notes = ${data.medicalNotes || sql`medical_notes`},
        photo_url = ${data.photoUrl || sql`photo_url`},
        status = ${data.status || sql`status`},
        updated_at = CURRENT_TIMESTAMP
    WHERE student_id = ${studentId}
    RETURNING *
  `,

  getEnrollments: (studentId) => sql`
    SELECT e.*, c.class_name, a.name as academic_year
    FROM enrollments e
    JOIN classes c ON e.class_id = c.class_id
    JOIN academic_years a ON e.academic_year_id = a.academic_year_id
    WHERE e.student_id = ${studentId}
    ORDER BY a.start_date DESC
  `,
};

const Guardian = {
  list: (studentId) => sql`
    SELECT * FROM guardians 
    WHERE student_id = ${studentId}
    ORDER BY is_primary DESC, created_at DESC
  `,
  
  findById: (guardianId) => sql`SELECT * FROM guardians WHERE guardian_id = ${guardianId}`,
  
  create: (data) => sql`
    INSERT INTO guardians (school_id, student_id, first_name, last_name, relationship, 
                          phone, email, address, occupation, is_primary)
    VALUES (${data.schoolId}, ${data.studentId}, ${data.firstName}, ${data.lastName},
            ${data.relationship}, ${data.phone}, ${data.email || null}, ${data.address || null},
            ${data.occupation || null}, ${data.isPrimary || false})
    RETURNING *
  `,
  
  update: (guardianId, data) => sql`
    UPDATE guardians
    SET phone = ${data.phone || sql`phone`},
        email = ${data.email || sql`email`},
        address = ${data.address || sql`address`},
        occupation = ${data.occupation || sql`occupation`},
        is_primary = ${data.isPrimary !== undefined ? data.isPrimary : sql`is_primary`},
        updated_at = CURRENT_TIMESTAMP
    WHERE guardian_id = ${guardianId}
    RETURNING *
  `,
};

// ============================================================
// ACADEMIC STRUCTURE QUERIES
// ============================================================

const AcademicYear = {
  list: (schoolId) => sql`
    SELECT * FROM academic_years 
    WHERE school_id = ${schoolId}
    ORDER BY start_date DESC
  `,
  
  current: (schoolId) => sql`
    SELECT * FROM academic_years 
    WHERE school_id = ${schoolId} AND is_current = true
    LIMIT 1
  `,
  
  findById: (academicYearId) => sql`
    SELECT * FROM academic_years WHERE academic_year_id = ${academicYearId}
  `,
  
  create: (data) => sql`
    INSERT INTO academic_years (school_id, name, code, start_date, end_date, status, created_by)
    VALUES (${data.schoolId}, ${data.name}, ${data.code}, ${data.startDate}, 
            ${data.endDate}, ${data.status || 'planned'}, ${data.createdBy})
    RETURNING *
  `,

  setCurrent: (academicYearId, schoolId) => sql`
    UPDATE academic_years
    SET is_current = false
    WHERE school_id = ${schoolId};
    
    UPDATE academic_years
    SET is_current = true
    WHERE academic_year_id = ${academicYearId}
  `,
};

const AcademicPeriod = {
  list: (academicYearId) => sql`
    SELECT * FROM academic_periods 
    WHERE academic_year_id = ${academicYearId}
    ORDER BY period_number ASC
  `,
  
  findById: (periodId) => sql`
    SELECT * FROM academic_periods WHERE period_id = ${periodId}
  `,
  
  create: (data) => sql`
    INSERT INTO academic_periods (school_id, academic_year_id, period_type, parent_period_id,
                                  period_number, name, code, start_date, end_date, weight, is_active)
    VALUES (${data.schoolId}, ${data.academicYearId}, ${data.periodType}, ${data.parentPeriodId || null},
            ${data.periodNumber}, ${data.name}, ${data.code || null}, ${data.startDate}, 
            ${data.endDate}, ${data.weight || 1.00}, true)
    RETURNING *
  `,
};

// ============================================================
// CLASS & SUBJECT QUERIES
// ============================================================

const ClassLevel = {
  list: (schoolId) => sql`
    SELECT * FROM class_levels 
    WHERE school_id = ${schoolId} AND is_active = true
    ORDER BY sort_order ASC
  `,
  
  findById: (levelId) => sql`SELECT * FROM class_levels WHERE level_id = ${levelId}`,
  
  create: (data) => sql`
    INSERT INTO class_levels (school_id, level_name, level_code, education_level, sort_order)
    VALUES (${data.schoolId}, ${data.levelName}, ${data.levelCode}, 
            ${data.educationLevel || 'secondary'}, ${data.sortOrder || 0})
    RETURNING *
  `,
};

const Stream = {
  list: (schoolId) => sql`
    SELECT * FROM streams 
    WHERE school_id = ${schoolId} AND is_active = true
    ORDER BY sort_order ASC
  `,
  
  findById: (streamId) => sql`SELECT * FROM streams WHERE stream_id = ${streamId}`,
  
  create: (data) => sql`
    INSERT INTO streams (school_id, stream_name, stream_code, description, sort_order)
    VALUES (${data.schoolId}, ${data.streamName}, ${data.streamCode}, 
            ${data.description || null}, ${data.sortOrder || 0})
    RETURNING *
  `,
};

const Class = {
  list: (schoolId, academicYearId = null) => {
    if (academicYearId) {
      return sql`
        SELECT c.*, l.level_name, s.stream_name, u.first_name, u.last_name
        FROM classes c
        LEFT JOIN class_levels l ON c.level_id = l.level_id
        LEFT JOIN streams s ON c.stream_id = s.stream_id
        LEFT JOIN users u ON c.class_teacher_id = u.user_id
        WHERE c.school_id = ${schoolId} AND c.academic_year_id = ${academicYearId}
        ORDER BY l.sort_order ASC, c.class_name ASC
      `;
    }
    return sql`
      SELECT c.*, l.level_name, s.stream_name, u.first_name, u.last_name
      FROM classes c
      LEFT JOIN class_levels l ON c.level_id = l.level_id
      LEFT JOIN streams s ON c.stream_id = s.stream_id
      LEFT JOIN users u ON c.class_teacher_id = u.user_id
      WHERE c.school_id = ${schoolId}
      ORDER BY c.academic_year_id DESC, l.sort_order ASC, c.class_name ASC
    `;
  },
  
  findById: (classId) => sql`
    SELECT c.*, l.level_name, s.stream_name, u.first_name, u.last_name
    FROM classes c
    LEFT JOIN class_levels l ON c.level_id = l.level_id
    LEFT JOIN streams s ON c.stream_id = s.stream_id
    LEFT JOIN users u ON c.class_teacher_id = u.user_id
    WHERE c.class_id = ${classId}
  `,
  
  create: (data) => sql`
    INSERT INTO classes (school_id, academic_year_id, level_id, stream_id, 
                        class_name, section, capacity, class_teacher_id, is_active)
    VALUES (${data.schoolId}, ${data.academicYearId}, ${data.levelId}, ${data.streamId || null},
            ${data.className}, ${data.section || null}, ${data.capacity || null}, 
            ${data.classTeacherId || null}, true)
    RETURNING *
  `,
  
  getStudents: (classId) => sql`
    SELECT s.* FROM students s
    JOIN enrollments e ON s.student_id = e.student_id
    WHERE e.class_id = ${classId} AND e.status = 'active'
    ORDER BY s.registration_number ASC
  `,
};

const Subject = {
  list: (schoolId) => sql`
    SELECT * FROM subjects 
    WHERE school_id = ${schoolId} AND is_active = true
    ORDER BY subject_name ASC
  `,
  
  findById: (subjectId) => sql`SELECT * FROM subjects WHERE subject_id = ${subjectId}`,
  
  create: (data) => sql`
    INSERT INTO subjects (school_id, subject_code, subject_name, coefficient, description, category, is_active)
    VALUES (${data.schoolId}, ${data.subjectCode}, ${data.subjectName}, 
            ${data.coefficient || 1.0}, ${data.description || null}, 
            ${data.category || 'general'}, true)
    RETURNING *
  `,
};

const ClassSubject = {
  list: (classId) => sql`
    SELECT cs.*, sub.subject_name, sub.coefficient, u.first_name, u.last_name
    FROM class_subjects cs
    JOIN subjects sub ON cs.subject_id = sub.subject_id
    JOIN users u ON cs.teacher_id = u.user_id
    WHERE cs.class_id = ${classId}
    ORDER BY sub.subject_name ASC
  `,
  
  findById: (classSubjectId) => sql`
    SELECT * FROM class_subjects WHERE class_subject_id = ${classSubjectId}
  `,
  
  create: (data) => sql`
    INSERT INTO class_subjects (school_id, class_id, subject_id, coefficient, max_mark, teacher_id, is_active)
    VALUES (${data.schoolId}, ${data.classId}, ${data.subjectId}, 
            ${data.coefficient || 1.0}, ${data.maxMark || 20.00}, ${data.teacherId}, true)
    RETURNING *
  `,
};

// ============================================================
// ENROLLMENT QUERIES
// ============================================================

const Enrollment = {
  list: (schoolId) => sql`
    SELECT e.*, s.student_number, s.registration_number, c.class_name, a.name as academic_year
    FROM enrollments e
    JOIN students s ON e.student_id = s.student_id
    JOIN classes c ON e.class_id = c.class_id
    JOIN academic_years a ON e.academic_year_id = a.academic_year_id
    WHERE e.school_id = ${schoolId}
    ORDER BY a.start_date DESC, s.registration_number ASC
  `,
  
  findById: (enrollmentId) => sql`
    SELECT * FROM enrollments WHERE enrollment_id = ${enrollmentId}
  `,
  
  getByStudent: (studentId, academicYearId = null) => {
    if (academicYearId) {
      return sql`
        SELECT * FROM enrollments 
        WHERE student_id = ${studentId} AND academic_year_id = ${academicYearId}
      `;
    }
    return sql`
      SELECT * FROM enrollments 
      WHERE student_id = ${studentId}
      ORDER BY created_at DESC
    `;
  },
  
  create: (data) => sql`
    INSERT INTO enrollments (school_id, student_id, class_id, academic_year_id, enrollment_date, status)
    VALUES (${data.schoolId}, ${data.studentId}, ${data.classId}, ${data.academicYearId}, 
            ${data.enrollmentDate || sql`CURRENT_DATE`}, 'active')
    RETURNING *
  `,
};

// ============================================================
// FINANCIAL QUERIES
// ============================================================

const FeeStructure = {
  list: (schoolId, academicYearId = null, levelId = null) => {
    if (academicYearId && levelId) {
      return sql`
        SELECT * FROM fee_structures
        WHERE school_id = ${schoolId} AND academic_year_id = ${academicYearId} AND level_id = ${levelId}
        ORDER BY fee_type ASC
      `;
    }
    return sql`
      SELECT * FROM fee_structures
      WHERE school_id = ${schoolId}
      ORDER BY academic_year_id DESC, fee_type ASC
    `;
  },
  
  create: (data) => sql`
    INSERT INTO fee_structures (school_id, academic_year_id, level_id, fee_type, amount, is_mandatory, description, created_by)
    VALUES (${data.schoolId}, ${data.academicYearId}, ${data.levelId}, ${data.feeType},
            ${data.amount}, ${data.isMandatory !== false}, ${data.description || null}, ${data.createdBy})
    RETURNING *
  `,
};

const EnrollmentFee = {
  list: (enrollmentId) => sql`
    SELECT ef.*, fs.fee_type, fs.amount
    FROM enrollments_fees ef
    JOIN fee_structures fs ON ef.fee_structure_id = fs.fee_structure_id
    WHERE ef.enrollment_id = ${enrollmentId}
    ORDER BY fs.fee_type ASC
  `,
  
  findById: (enrollmentFeeId) => sql`
    SELECT * FROM enrollments_fees WHERE enrollment_fee_id = ${enrollmentFeeId}
  `,
};

const Payment = {
  list: (schoolId) => sql`
    SELECT p.*, s.student_number, s.registration_number, u.first_name, u.last_name
    FROM payments p
    JOIN students s ON p.student_id = s.student_id
    LEFT JOIN users u ON p.recorded_by = u.user_id
    WHERE p.school_id = ${schoolId}
    ORDER BY p.payment_date DESC
  `,
  
  getByStudent: (studentId) => sql`
    SELECT * FROM payments 
    WHERE student_id = ${studentId}
    ORDER BY payment_date DESC
  `,
  
  getByEnrollmentFee: (enrollmentFeeId) => sql`
    SELECT * FROM payments 
    WHERE enrollment_fee_id = ${enrollmentFeeId}
    ORDER BY payment_date DESC
  `,
  
  summary: (schoolId) => sql`
    SELECT 
      COUNT(*) as total_payments,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as amount_received,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as amount_pending
    FROM payments
    WHERE school_id = ${schoolId}
  `,
  
  create: (data) => sql`
    INSERT INTO payments (school_id, student_id, enrollment_fee_id, amount, payment_date, 
                         payment_method, transaction_reference, receipt_number, mobile_money_ref,
                         status, recorded_by, notes)
    VALUES (${data.schoolId}, ${data.studentId}, ${data.enrollmentFeeId}, ${data.amount},
            ${data.paymentDate || sql`CURRENT_DATE`}, ${data.paymentMethod || 'cash'},
            ${data.transactionReference || null}, ${data.receiptNumber || null},
            ${data.mobileMoneyRef || null}, 'completed', ${data.recordedBy}, ${data.notes || null})
    RETURNING *
  `,
};

// ============================================================
// GRADE QUERIES
// ============================================================

const Grade = {
  list: (schoolId, periodId = null) => {
    if (periodId) {
      return sql`
        SELECT g.*, s.student_number, s.registration_number, subj.subject_name, u.first_name, u.last_name
        FROM grades g
        JOIN students s ON g.student_id = s.student_id
        JOIN class_subjects cs ON g.class_subject_id = cs.class_subject_id
        JOIN subjects subj ON cs.subject_id = subj.subject_id
        LEFT JOIN users u ON g.entered_by = u.user_id
        WHERE g.school_id = ${schoolId} AND g.period_id = ${periodId}
        ORDER BY s.registration_number ASC
      `;
    }
    return sql`
      SELECT * FROM grades 
      WHERE school_id = ${schoolId}
      ORDER BY created_at DESC
    `;
  },
  
  getByStudent: (studentId, periodId = null) => {
    if (periodId) {
      return sql`
        SELECT g.*, subj.subject_name, cs.coefficient
        FROM grades g
        JOIN class_subjects cs ON g.class_subject_id = cs.class_subject_id
        JOIN subjects subj ON cs.subject_id = subj.subject_id
        WHERE g.student_id = ${studentId} AND g.period_id = ${periodId}
        ORDER BY subj.subject_name ASC
      `;
    }
    return sql`
      SELECT g.*, subj.subject_name, ap.name as period_name
      FROM grades g
      JOIN class_subjects cs ON g.class_subject_id = cs.class_subject_id
      JOIN subjects subj ON cs.subject_id = subj.subject_id
      JOIN academic_periods ap ON g.period_id = ap.period_id
      WHERE g.student_id = ${studentId}
      ORDER BY ap.start_date DESC, subj.subject_name ASC
    `;
  },
  
  create: (data) => sql`
    INSERT INTO grades (school_id, student_id, class_subject_id, period_id, score_raw, 
                       score_normalized, max_mark, is_absent, comment, entered_by)
    VALUES (${data.schoolId}, ${data.studentId}, ${data.classSubjectId}, ${data.periodId},
            ${data.scoreRaw || null}, ${data.scoreNormalized || null}, 
            ${data.maxMark || 20.00}, ${data.isAbsent || false}, ${data.comment || null}, ${data.enteredBy})
    RETURNING *
  `,
  
  update: (gradeId, data) => sql`
    UPDATE grades
    SET score_raw = ${data.scoreRaw || sql`score_raw`},
        score_normalized = ${data.scoreNormalized || sql`score_normalized`},
        is_absent = ${data.isAbsent !== undefined ? data.isAbsent : sql`is_absent`},
        comment = ${data.comment || sql`comment`},
        updated_by = ${data.updatedBy},
        updated_at = CURRENT_TIMESTAMP
    WHERE grade_id = ${gradeId}
    RETURNING *
  `,
};

// ============================================================
// REPORT CARD QUERIES
// ============================================================

const ReportCard = {
  findById: (reportCardId) => sql`
    SELECT rc.*, s.student_number, s.registration_number, c.class_name, a.name as academic_year
    FROM report_cards rc
    JOIN students s ON rc.student_id = s.student_id
    JOIN classes c ON rc.class_id = c.class_id
    JOIN academic_years a ON rc.academic_year_id = a.academic_year_id
    WHERE rc.report_card_id = ${reportCardId}
  `,
  
  getByStudent: (studentId, academicYearId = null) => {
    if (academicYearId) {
      return sql`
        SELECT * FROM report_cards
        WHERE student_id = ${studentId} AND academic_year_id = ${academicYearId}
        ORDER BY created_at DESC
      `;
    }
    return sql`
      SELECT * FROM report_cards
      WHERE student_id = ${studentId}
      ORDER BY academic_year_id DESC, term_id DESC
    `;
  },
  
  create: (data) => sql`
    INSERT INTO report_cards (school_id, student_id, class_id, academic_year_id, term_id, period_id,
                             total_marks, average, rank, remarks, class_average, is_term_report,
                             generated_by, class_teacher_comment)
    VALUES (${data.schoolId}, ${data.studentId}, ${data.classId}, ${data.academicYearId},
            ${data.termId || null}, ${data.periodId || null}, ${data.totalMarks || null},
            ${data.average || null}, ${data.rank || null}, ${data.remarks || null},
            ${data.classAverage || null}, ${data.isTermReport !== false}, ${data.generatedBy},
            ${data.classTeacherComment || null})
    RETURNING *
  `,

  publish: (reportCardId) => sql`
    UPDATE report_cards
    SET is_published = true, published_at = CURRENT_TIMESTAMP
    WHERE report_card_id = ${reportCardId}
    RETURNING *
  `,
};

const ReportCardDetail = {
  list: (reportCardId) => sql`
    SELECT rcd.*, subj.subject_name
    FROM report_card_details rcd
    JOIN class_subjects cs ON rcd.class_subject_id = cs.class_subject_id
    JOIN subjects subj ON cs.subject_id = subj.subject_id
    WHERE rcd.report_card_id = ${reportCardId}
    ORDER BY subj.subject_name ASC
  `,
};

// ============================================================
// ATTENDANCE QUERIES
// ============================================================

const Attendance = {
  list: (schoolId, classId = null, date = null) => {
    if (classId && date) {
      return sql`
        SELECT a.*, s.student_number, s.registration_number
        FROM attendance a
        JOIN students s ON a.student_id = s.student_id
        WHERE a.class_id = ${classId} AND a.date = ${date}
        ORDER BY s.registration_number ASC
      `;
    }
    return sql`
      SELECT * FROM attendance 
      WHERE school_id = ${schoolId}
      ORDER BY date DESC
    `;
  },
  
  getByStudent: (studentId, startDate = null, endDate = null) => {
    if (startDate && endDate) {
      return sql`
        SELECT * FROM attendance
        WHERE student_id = ${studentId} AND date BETWEEN ${startDate} AND ${endDate}
        ORDER BY date DESC
      `;
    }
    return sql`
      SELECT * FROM attendance
      WHERE student_id = ${studentId}
      ORDER BY date DESC
    `;
  },
  
  create: (data) => sql`
    INSERT INTO attendance (school_id, student_id, class_id, date, status, 
                           minutes_late, reason, justified, recorded_by)
    VALUES (${data.schoolId}, ${data.studentId}, ${data.classId}, ${data.date},
            ${data.status}, ${data.minutesLate || 0}, ${data.reason || null},
            ${data.justified || false}, ${data.recordedBy})
    RETURNING *
  `,
};

// ============================================================
// NOTIFICATION & AUDIT QUERIES
// ============================================================

const Notification = {
  list: (userId) => sql`
    SELECT * FROM notifications
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `,
  
  unread: (userId) => sql`
    SELECT * FROM notifications
    WHERE user_id = ${userId} AND is_read = false
    ORDER BY created_at DESC
  `,
  
  create: (data) => sql`
    INSERT INTO notifications (school_id, user_id, type, title, message, related_entity_id)
    VALUES (${data.schoolId}, ${data.userId}, ${data.type}, ${data.title}, ${data.message}, ${data.relatedEntityId || null})
    RETURNING *
  `,
  
  markRead: (notificationId) => sql`
    UPDATE notifications
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE notification_id = ${notificationId}
    RETURNING *
  `,
};

const AuditLog = {
  list: (schoolId, limit = 100) => sql`
    SELECT * FROM audit_logs
    WHERE school_id = ${schoolId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `,
  
  create: (data) => sql`
    INSERT INTO audit_logs (school_id, user_id, action, entity_type, entity_id, 
                           old_values, new_values, ip_address, user_agent)
    VALUES (${data.schoolId}, ${data.userId}, ${data.action}, ${data.entityType || null},
            ${data.entityId || null}, ${data.oldValues ? JSON.stringify(data.oldValues) : null},
            ${data.newValues ? JSON.stringify(data.newValues) : null}, ${data.ipAddress || null},
            ${data.userAgent || null})
    RETURNING *
  `,
};

module.exports = {
  User,
  Role,
  School,
  Student,
  Guardian,
  AcademicYear,
  AcademicPeriod,
  ClassLevel,
  Stream,
  Class,
  Subject,
  ClassSubject,
  Enrollment,
  FeeStructure,
  EnrollmentFee,
  Payment,
  Grade,
  ReportCard,
  ReportCardDetail,
  Attendance,
  Notification,
  AuditLog,
};
