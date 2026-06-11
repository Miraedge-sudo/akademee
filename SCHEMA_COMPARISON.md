# Database Schema Comparison Report

## Summary
Your MySQL schema defines a comprehensive multi-tenant school management system, but the backend PostgreSQL implementation has **critical gaps and mismatches**. Below is a detailed analysis.

---

## 🔴 CRITICAL ISSUES

### 1. **Database System Mismatch**
- **Expected**: MySQL 8.0+
- **Current**: PostgreSQL
- **Impact**: `ENUM` types, UUID generation, and data type handling differ significantly

### 2. **Missing Backend Model Operations**
The following tables exist in the database but lack corresponding backend model query methods:

#### `offline_sync_queue`
- **Status**: Table exists in DB, but NO model methods in backend
- **Operations needed**:
  - `list(schoolId, status, limit)`
  - `create(data)`
  - `markSynced(queueId)`
  - `markFailed(queueId, errorMessage)`

#### `enrollment_fees` Model Issues
- **Model exists** but operations are incomplete
- **Missing**: `findByStatus()`, `getByEnrollmentId()`, `update()` operations

---

## 📋 FIELD-LEVEL MISMATCHES

### **Schools Table**
| Field | MySQL Schema | Backend Model | Status |
|-------|---|---|---|
| `school_id` | CHAR(36)/UUID | ✓ Handled | OK |
| `name` | VARCHAR(255) | ✓ | OK |
| `subdomain` | VARCHAR(100) UNIQUE | ✓ | OK |
| `email` | VARCHAR(255) UNIQUE | ✓ | OK |
| `phone` | VARCHAR(50) | ✓ | OK |
| `address` | TEXT | ✓ | OK |
| `city` | VARCHAR(100) | ✓ | OK |
| `region` | VARCHAR(100) | ✓ | OK |
| `logo_url` | VARCHAR(500) | ❌ MISSING | **ADD TO MODEL** |
| `academic_system` | ENUM('TERM_SEQUENCE', 'SEMESTER_CA_EXAM') | ✓ (as VARCHAR) | OK |
| `subscription_plan` | ENUM('free', 'basic', 'premium', 'enterprise') | ✓ (but limited) | NEEDS UPDATE |
| `subscription_status` | ENUM('active', 'trial', 'suspended', 'expired') | ❌ MISSING | **ADD TO MODEL** |
| `subscription_start_date` | DATE | ❌ MISSING | **ADD TO MODEL** |
| `subscription_end_date` | DATE | ❌ MISSING | **ADD TO MODEL** |
| `is_active` | BOOLEAN | ✓ | OK |
| `settings` | JSON | ❌ MISSING | **ADD TO MODEL** |
| `created_at` | TIMESTAMP | ✓ | OK |
| `updated_at` | TIMESTAMP | ✓ | OK |

### **Users Table**
| Field | MySQL Schema | Backend Model | Status |
|-------|---|---|---|
| `user_id` | CHAR(36)/UUID | ✓ | OK |
| `school_id` | CHAR(36) FK | ✓ | OK |
| `first_name` | VARCHAR(100) | ✓ | OK |
| `last_name` | VARCHAR(100) | ✓ | OK |
| `email` | VARCHAR(255) | ✓ | OK |
| `password_hash` | VARCHAR(255) | ✓ | OK |
| `phone` | VARCHAR(50) | ✓ | OK |
| `avatar_url` | VARCHAR(500) | ✓ | OK |
| `is_active` | BOOLEAN | ✓ | OK |
| `last_login` | TIMESTAMP | ❌ MISSING | **ADD TO MODEL** |
| `last_ip` | VARCHAR(45) | ❌ MISSING | **ADD TO MODEL** |
| `password_changed_at` | TIMESTAMP | ❌ MISSING | **ADD TO MODEL** |
| `created_at` | TIMESTAMP | ✓ | OK |
| `updated_at` | TIMESTAMP | ✓ | OK |

### **Grades Table**
| Field | MySQL Schema | Backend Model | Status |
|-------|---|---|---|
| `grade_id` | CHAR(36) | ✓ | OK |
| `school_id` | CHAR(36) | ✓ | OK |
| `student_id` | CHAR(36) | ✓ | OK |
| `class_subject_id` | CHAR(36) | ✓ | OK |
| `period_id` | CHAR(36) | ✓ | OK |
| `score_raw` | DECIMAL(5,2) | ✓ | OK |
| `score_normalized` | DECIMAL(5,2) | ✓ | OK |
| `max_mark` | DECIMAL(5,2) | ✓ | OK |
| `is_absent` | BOOLEAN | ✓ | OK |
| `comment` | TEXT | ✓ | OK |
| `entered_by` | CHAR(36) FK | ✓ | OK |
| `entered_at` | TIMESTAMP | ❌ MISSING | **RENAME `entered_at` → CURRENT_TIMESTAMP** |
| `updated_by` | CHAR(36) FK | ✓ | OK |
| `updated_at` | TIMESTAMP | ✓ | OK |

### **Report Cards Table**
| Field | MySQL Schema | Backend Model | Status |
|---|---|---|---|
| All major fields | ✓ Present | ✓ Model supports most | ⚠️ PARTIAL |
| `sequence_id` | CHAR(36) FK | ✓ | OK |
| `annual_average` | DECIMAL(5,2) | ✓ | OK |
| `annual_rank` | INT | ✓ | OK |
| `annual_result` | VARCHAR(50) | ✓ | OK |

---

## 🔧 MISSING BACKEND MODEL OPERATIONS

### **School Model - Enhancement Needed**
```javascript
// Missing methods:
School.updateSubscriptionStatus = (schoolId, status) => ...
School.updateSettings = (schoolId, settings) => ...
School.getBySubdomain = (subdomain) => ... // EXISTS but needs query
School.getSubscriptionStatus = (schoolId) => ...
```

### **Payment Model - Enhancement Needed**
```javascript
// Current method has issues:
Payment.summary = (schoolId) => ...
// Should return aggregate counts, not list

// Missing method:
Payment.getByEnrollmentFee = (enrollmentFeeId) => ...
```

### **Grade Model - Enhancement Needed**
```javascript
// Missing update method:
Grade.update = (gradeId, data) => ...

// Missing findByPeriod:
Grade.findByPeriod = (periodId) => ...
```

### **Enrollment Model - Missing Entirely**
```javascript
// Backend lacks this model entirely but DB has enrollments table
// Needs full CRUD:
Enrollment.list = (schoolId) => ...
Enrollment.findById = (enrollmentId) => ...
Enrollment.create = (data) => ...
Enrollment.update = (enrollmentId, data) => ...
```

### **FeeStructure Model - Missing Entirely**
```javascript
// Backend lacks this model but DB has fee_structures table
// Needs full CRUD:
FeeStructure.list = (schoolId, academicYearId, levelId) => ...
FeeStructure.create = (data) => ...
```

---

## 📊 TABLE COVERAGE MATRIX

| Table | DB Schema | Backend Model | CRUD Coverage | Status |
|-------|---|---|---|---|
| schools | ✓ | ✓ Partial | C-R-- | ⚠️ Missing UPDATE |
| users | ✓ | ✓ | -R-U | ⚠️ Missing CREATE/DELETE |
| roles | ✓ | ✓ | -R-- | OK |
| user_roles | ✓ | ✓ | CRU- | OK |
| students | ✓ | ✓ | CRUD | ✓ OK |
| guardians | ✓ | ✓ | CR-U | ⚠️ Missing DELETE |
| academic_years | ✓ | ✓ Partial | CR-- | OK |
| academic_periods | ✓ | ✓ Partial | CR-- | OK |
| class_levels | ✓ | ✓ | CR-- | OK |
| streams | ✓ | ✓ | CR-- | OK |
| classes | ✓ | ✓ | CR-- | OK |
| subjects | ✓ | ✓ | CR-- | OK |
| class_subjects | ✓ | ✓ | CR-- | OK |
| enrollments | ✓ | ❌ MISSING | ---- | 🔴 **ADD MODEL** |
| fee_structures | ✓ | ✓ Partial | CR-- | ⚠️ Incomplete |
| enrollments_fees | ✓ | ✓ Limited | -R-- | ⚠️ Limited ops |
| payments | ✓ | ✓ | CR-U | ⚠️ Missing DELETE |
| grades | ✓ | ✓ | CRU- | ⚠️ Limited query ops |
| report_cards | ✓ | ✓ | CR-U | ⚠️ Limited ops |
| report_card_details | ✓ | ✓ | CR-- | OK |
| attendance | ✓ | ✓ | CR-- | OK |
| notifications | ✓ | ✓ | CR-U | ⚠️ Missing markRead |
| audit_logs | ✓ | ✓ | CR-- | OK |
| offline_sync_queue | ✓ | ❌ MISSING | ---- | 🔴 **ADD MODEL** |

---

## 🚨 RECOMMENDED ACTIONS

### Priority 1: Critical (Blocks functionality)
1. **Add `Enrollment` model** with full CRUD operations
2. **Add `FeeStructure` model** with full CRUD operations
3. **Add `offline_sync_queue` model** for PWA sync functionality
4. **Complete `Payment.summary()`** - currently broken logic

### Priority 2: High (Incomplete implementations)
1. Add missing `School` fields: `logo_url`, `settings`, subscription tracking
2. Add missing `User` fields: login tracking (`last_login`, `last_ip`)
3. Complete `Grade` model with `update()` and additional queries
4. Extend `Notification` model with `markRead()` operation

### Priority 3: Medium (Data integrity)
1. Add input validation for all ENUM-type fields
2. Add update methods for tables that only have create
3. Complete delete operations where missing

### Priority 4: Low (Optimization)
1. Add `findByStatus()` queries for tracking tables
2. Add date-range queries for audit/sync/notification tables
3. Add pagination support to list queries

---

## 🔄 SCHEMA ALIGNMENT CHECKLIST

- [ ] Database migrated from PostgreSQL to MySQL 8.0+ (or update schema to PostgreSQL syntax)
- [ ] All MySQL ENUM types properly mapped to backend validation
- [ ] `Enrollment` model created with full CRUD
- [ ] `FeeStructure` model created with full CRUD
- [ ] `offline_sync_queue` model created
- [ ] School subscription fields added to model
- [ ] User login tracking fields added to model
- [ ] Payment.summary() logic fixed
- [ ] Grade.update() method added
- [ ] All UPDATE operations completed in models
- [ ] All DELETE operations completed in models
- [ ] Input validation added for ENUM fields in controllers
- [ ] API routes created for missing entities (enrollments, fee_structures, offline_sync)

---

## 📝 NOTES

- **Database Backend**: Currently using PostgreSQL but schema is designed for MySQL. Consider standardizing.
- **Model Coverage**: ~70% of tables have basic model definitions, but full CRUD is incomplete in most.
- **API Routes**: No routes exist for enrollments, fee_structures, or offline sync queue.
- **Validation**: Field constraints (ENUMs, unique keys) exist in DB but not enforced in backend controllers.
- **Auth**: User tracking fields (`last_login`, `last_ip`) needed for security/analytics features.
