-- ======================================================
-- AKADEMEE - Multi-Tenant School Management System
-- PostgreSQL Database Schema (Converted from MySQL)
-- ======================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SET client_encoding = 'UTF8';

-- ======================================================
-- CORE TENANT TABLES
-- ======================================================

-- Schools table (root tenant entity)
CREATE TABLE IF NOT EXISTS schools (
    school_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    logo_url VARCHAR(500),
    academic_system VARCHAR(50) NOT NULL DEFAULT 'TERM_SEQUENCE',
    subscription_plan VARCHAR(20) DEFAULT 'free',
    subscription_status VARCHAR(20) DEFAULT 'active',
    subscription_start_date DATE,
    subscription_end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    settings JSONB DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_academic_system CHECK (academic_system IN ('TERM_SEQUENCE', 'SEMESTER_CA_EXAM')),
    CONSTRAINT chk_subscription_plan CHECK (subscription_plan IN ('free', 'basic', 'premium', 'enterprise')),
    CONSTRAINT chk_subscription_status CHECK (subscription_status IN ('active', 'trial', 'suspended', 'expired'))
);

CREATE INDEX idx_schools_subdomain ON schools(subdomain);
CREATE INDEX idx_schools_email ON schools(email);
CREATE INDEX idx_schools_status ON schools(is_active, subscription_status);

-- ======================================================
-- USER MANAGEMENT TABLES
-- ======================================================

-- Roles table (system-wide roles)
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table (all platform users)
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(school_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    last_ip VARCHAR(45),
    password_changed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_email_school UNIQUE (email, school_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_school_id ON users(school_id);
CREATE INDEX idx_users_active ON users(is_active);

-- User roles (user role assignments)
CREATE TABLE IF NOT EXISTS user_roles (
    user_role_id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role_id INT NOT NULL REFERENCES roles(role_id),
    assigned_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_role UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);

-- Insert default roles
INSERT INTO roles (role_name, role_code, is_system_role) VALUES
    ('Super Administrator', 'SUPER_ADMIN', TRUE),
    ('School Administrator', 'ADMIN', TRUE),
    ('Teacher', 'TEACHER', TRUE),
    ('Student', 'STUDENT', TRUE),
    ('Parent', 'PARENT', TRUE),
    ('Accountant', 'ACCOUNTANT', TRUE),
    ('Librarian', 'LIBRARIAN', TRUE)
ON CONFLICT (role_code) DO NOTHING;

-- ======================================================
-- STUDENT MANAGEMENT TABLES
-- ======================================================

-- Students table
CREATE TABLE IF NOT EXISTS students (
    student_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    student_number VARCHAR(50) NOT NULL,
    registration_number VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    place_of_birth VARCHAR(100),
    gender VARCHAR(20) DEFAULT 'male',
    nationality VARCHAR(100),
    religion VARCHAR(50),
    blood_group VARCHAR(5),
    medical_notes TEXT,
    photo_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    enrollment_type VARCHAR(50) DEFAULT 'new',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_student_number_school UNIQUE (student_number, school_id),
    CONSTRAINT uk_registration_number_school UNIQUE (registration_number, school_id),
    CONSTRAINT chk_gender CHECK (gender IN ('male', 'female', 'other')),
    CONSTRAINT chk_student_status CHECK (status IN ('active', 'inactive', 'graduated', 'transferred', 'suspended')),
    CONSTRAINT chk_enrollment_type CHECK (enrollment_type IN ('new', 'transfer', 'repeating'))
);

CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_user_id ON students(user_id);
CREATE INDEX idx_students_status ON students(status);

-- Guardians table
CREATE TABLE IF NOT EXISTS guardians (
    guardian_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    address TEXT,
    occupation VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_relationship CHECK (relationship IN ('father', 'mother', 'guardian', 'other'))
);

CREATE INDEX idx_guardians_school_id ON guardians(school_id);
CREATE INDEX idx_guardians_student_id ON guardians(student_id);

-- ======================================================
-- ACADEMIC STRUCTURE TABLES
-- ======================================================

-- Academic years
CREATE TABLE IF NOT EXISTS academic_years (
    academic_year_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT FALSE,
    is_archived BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'planned',
    created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_academic_year_school UNIQUE (name, school_id),
    CONSTRAINT chk_academic_year_status CHECK (status IN ('planned', 'active', 'completed', 'archived'))
);

CREATE INDEX idx_academic_years_school_id ON academic_years(school_id);
CREATE INDEX idx_academic_years_current ON academic_years(is_current);

-- Academic periods (Terms, Sequences, Semesters, CA, Exam)
CREATE TABLE IF NOT EXISTS academic_periods (
    period_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
    period_type VARCHAR(50) NOT NULL,
    parent_period_id UUID REFERENCES academic_periods(period_id) ON DELETE CASCADE,
    period_number INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    weight DECIMAL(5,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT FALSE,
    lock_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_period_type CHECK (period_type IN ('term', 'semester', 'sequence', 'ca', 'exam'))
);

CREATE INDEX idx_academic_periods_school_year ON academic_periods(school_id, academic_year_id);
CREATE INDEX idx_academic_periods_parent ON academic_periods(parent_period_id);

-- ======================================================
-- CLASS AND SUBJECT MANAGEMENT
-- ======================================================

-- Class levels
CREATE TABLE IF NOT EXISTS class_levels (
    level_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    level_name VARCHAR(100) NOT NULL,
    level_code VARCHAR(20) NOT NULL,
    education_level VARCHAR(50) DEFAULT 'secondary',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_level_name_school UNIQUE (level_name, school_id),
    CONSTRAINT chk_education_level CHECK (education_level IN ('nursery', 'primary', 'secondary', 'high_school', 'university', 'vocational'))
);

CREATE INDEX idx_class_levels_school_id ON class_levels(school_id);

-- Streams
CREATE TABLE IF NOT EXISTS streams (
    stream_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    stream_name VARCHAR(100) NOT NULL,
    stream_code VARCHAR(20) NOT NULL,
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_stream_name_school UNIQUE (stream_name, school_id)
);

CREATE INDEX idx_streams_school_id ON streams(school_id);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
    class_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id) ON DELETE CASCADE,
    level_id UUID NOT NULL REFERENCES class_levels(level_id),
    stream_id UUID REFERENCES streams(stream_id),
    class_name VARCHAR(100) NOT NULL,
    section VARCHAR(10),
    capacity INT,
    class_teacher_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_class_name_school_year UNIQUE (class_name, school_id, academic_year_id)
);

CREATE INDEX idx_classes_school_year ON classes(school_id, academic_year_id);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
    subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    subject_code VARCHAR(20) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    coefficient DECIMAL(3,1) NOT NULL DEFAULT 1.0,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_subject_code_school UNIQUE (subject_code, school_id),
    CONSTRAINT chk_category CHECK (category IN ('science', 'arts', 'commercial', 'general', 'language'))
);

CREATE INDEX idx_subjects_school_id ON subjects(school_id);

-- Class subjects
CREATE TABLE IF NOT EXISTS class_subjects (
    class_subject_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(subject_id),
    coefficient DECIMAL(3,1) NOT NULL DEFAULT 1.0,
    max_mark DECIMAL(5,2) DEFAULT 20.00,
    teacher_id UUID NOT NULL REFERENCES users(user_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_class_subject UNIQUE (class_id, subject_id)
);

CREATE INDEX idx_class_subjects_class_id ON class_subjects(class_id);
CREATE INDEX idx_class_subjects_teacher_id ON class_subjects(teacher_id);

-- ======================================================
-- ENROLLMENT TABLES
-- ======================================================

-- Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(class_id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id),
    enrollment_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    promotion_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_student_academic_year UNIQUE (student_id, academic_year_id),
    CONSTRAINT chk_enrollment_status CHECK (status IN ('active', 'transferred', 'withdrawn', 'completed', 'graduated')),
    CONSTRAINT chk_promotion_status CHECK (promotion_status IN ('pending', 'promoted', 'repeat', 'graduated', 'transferred', 'withdrawn'))
);

CREATE INDEX idx_enrollments_school_id ON enrollments(school_id);
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);

-- ======================================================
-- FINANCIAL TABLES
-- ======================================================

-- Fee structures
CREATE TABLE IF NOT EXISTS fee_structures (
    fee_structure_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id),
    level_id UUID NOT NULL REFERENCES class_levels(level_id),
    fee_type VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    is_mandatory BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fee_structures_school_year_level ON fee_structures(school_id, academic_year_id, level_id);

-- Enrollment fees
CREATE TABLE IF NOT EXISTS enrollments_fees (
    enrollment_fee_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_id UUID NOT NULL REFERENCES enrollments(enrollment_id) ON DELETE CASCADE,
    fee_structure_id UUID NOT NULL REFERENCES fee_structures(fee_structure_id),
    amount_expected DECIMAL(15,2) NOT NULL,
    amount_paid DECIMAL(15,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending',
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_enrollment_fee_status CHECK (status IN ('pending', 'partial', 'paid', 'overdue'))
);

CREATE INDEX idx_enrollments_fees_enrollment ON enrollments_fees(enrollment_id);
CREATE INDEX idx_enrollments_fees_status ON enrollments_fees(status);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(student_id),
    enrollment_fee_id UUID NOT NULL REFERENCES enrollments_fees(enrollment_fee_id),
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'cash',
    transaction_reference VARCHAR(100),
    receipt_number VARCHAR(100) UNIQUE,
    mobile_money_provider VARCHAR(50) DEFAULT 'none',
    mobile_money_ref VARCHAR(100),
    webhook_payload JSONB,
    status VARCHAR(50) DEFAULT 'pending',
    recorded_by UUID NOT NULL REFERENCES users(user_id),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_payment_method CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'cheque', 'card')),
    CONSTRAINT chk_mobile_money_provider CHECK (mobile_money_provider IN ('orange', 'mtn', 'none')),
    CONSTRAINT chk_payment_status CHECK (status IN ('pending', 'completed', 'failed', 'refunded'))
);

CREATE INDEX idx_payments_school_id ON payments(school_id);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_receipt ON payments(receipt_number);

-- ======================================================
-- GRADES TABLE
-- ======================================================

-- Grades
CREATE TABLE IF NOT EXISTS grades (
    grade_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    class_subject_id UUID NOT NULL REFERENCES class_subjects(class_subject_id),
    period_id UUID NOT NULL REFERENCES academic_periods(period_id),
    score_raw DECIMAL(5,2),
    score_normalized DECIMAL(5,2),
    max_mark DECIMAL(5,2) DEFAULT 20.00,
    is_absent BOOLEAN DEFAULT FALSE,
    comment TEXT,
    entered_by UUID NOT NULL REFERENCES users(user_id),
    entered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID REFERENCES users(user_id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_student_subject_period UNIQUE (student_id, class_subject_id, period_id)
);

CREATE INDEX idx_grades_school_id ON grades(school_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_grades_period_id ON grades(period_id);

-- ======================================================
-- REPORT CARDS TABLE
-- ======================================================

-- Report cards
CREATE TABLE IF NOT EXISTS report_cards (
    report_card_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(student_id),
    class_id UUID NOT NULL REFERENCES classes(class_id),
    academic_year_id UUID NOT NULL REFERENCES academic_years(academic_year_id),
    term_id UUID REFERENCES academic_periods(period_id),
    period_id UUID REFERENCES academic_periods(period_id),
    sequence_id UUID REFERENCES academic_periods(period_id),
    total_marks DECIMAL(8,2),
    average DECIMAL(5,2),
    rank INT,
    remarks VARCHAR(100),
    class_average DECIMAL(5,2),
    highest_average DECIMAL(5,2),
    lowest_average DECIMAL(5,2),
    class_size INT,
    annual_average DECIMAL(5,2),
    annual_rank INT,
    annual_result VARCHAR(50),
    decision VARCHAR(100),
    absences_count INT DEFAULT 0,
    lates_count INT DEFAULT 0,
    class_teacher_comment TEXT,
    head_teacher_comment TEXT,
    is_term_report BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMP,
    generated_by UUID NOT NULL REFERENCES users(user_id),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pdf_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_cards_student_class_term ON report_cards(student_id, class_id, term_id);
CREATE INDEX idx_report_cards_student_academic_year ON report_cards(student_id, academic_year_id);

-- Report card details
CREATE TABLE IF NOT EXISTS report_card_details (
    detail_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_card_id UUID NOT NULL REFERENCES report_cards(report_card_id) ON DELETE CASCADE,
    class_subject_id UUID NOT NULL REFERENCES class_subjects(class_subject_id),
    score DECIMAL(5,2),
    grade VARCHAR(2),
    comment TEXT,
    eval_5 DECIMAL(5,2),
    eval_6 DECIMAL(5,2),
    movement DECIMAL(5,2),
    teacher_signature VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_card_details_report_card ON report_card_details(report_card_id);

-- ======================================================
-- ATTENDANCE TABLE
-- ======================================================

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
    attendance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(class_id),
    date DATE NOT NULL,
    status VARCHAR(50) NOT NULL,
    minutes_late INT DEFAULT 0,
    reason TEXT,
    justified BOOLEAN DEFAULT FALSE,
    recorded_by UUID NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_attendance_student_class_date UNIQUE (student_id, class_id, date),
    CONSTRAINT chk_attendance_status CHECK (status IN ('present', 'absent', 'late', 'excused'))
);

CREATE INDEX idx_attendance_class_date ON attendance(class_id, date);

-- ======================================================
-- NOTIFICATION AND AUDIT TABLES
-- ======================================================

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    related_entity_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_notification_type CHECK (type IN ('grade', 'attendance', 'payment', 'discipline', 'system', 'announcement'))
);

CREATE INDEX idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id BIGSERIAL PRIMARY KEY,
    school_id UUID,
    user_id UUID NOT NULL REFERENCES users(user_id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_school_user ON audit_logs(school_id, user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ======================================================
-- OFFLINE SYNC TABLE (For PWA)
-- ======================================================

CREATE TABLE IF NOT EXISTS offline_sync_queue (
    queue_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id),
    device_id VARCHAR(255) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_at TIMESTAMP,
    CONSTRAINT chk_sync_status CHECK (status IN ('pending', 'synced', 'failed', 'conflict'))
);

CREATE INDEX idx_offline_sync_status_created ON offline_sync_queue(status, created_at);
CREATE INDEX idx_grades_student_id ON grades(student_id);
CREATE INDEX idx_attendance_student_id ON attendance(student_id);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_classes_school_id ON classes(school_id);
