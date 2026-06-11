-- Seed data for Akademee - inserts at least 5 rows per table
-- Run after schema.sql

-- Insert 5 schools
INSERT INTO schools (name, subdomain, email, phone, city, region, academic_system, subscription_plan)
VALUES
  ('Demo School A','demo-a','contact@demo-a.edu','+250700000001','Kigali','RW','TERM_SEQUENCE','free'),
  ('Demo School B','demo-b','contact@demo-b.edu','+250700000002','Kigali','RW','TERM_SEQUENCE','basic'),
  ('Demo School C','demo-c','contact@demo-c.edu','+250700000003','Kigali','RW','TERM_SEQUENCE','premium'),
  ('Demo School D','demo-d','contact@demo-d.edu','+250700000004','Kigali','RW','TERM_SEQUENCE','enterprise'),
  ('Demo School E','demo-e','contact@demo-e.edu','+250700000005','Kigali','RW','TERM_SEQUENCE','free')
ON CONFLICT (subdomain) DO NOTHING;

-- Insert 5 users (will be referenced by students, teachers, recorders)
INSERT INTO users (school_id, first_name, last_name, email, password_hash, phone)
SELECT s.school_id, v.first_name, v.last_name, v.email, 'seeded-password-hash', v.phone
FROM (VALUES
  ('Demo','User','demo.user1@demo.edu','+250788000001'),
  ('Demo','User','demo.user2@demo.edu','+250788000002'),
  ('Demo','User','demo.user3@demo.edu','+250788000003'),
  ('Demo','User','demo.user4@demo.edu','+250788000004'),
  ('Demo','User','demo.user5@demo.edu','+250788000005')
) AS v(first_name,last_name,email,phone)
CROSS JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s
ON CONFLICT (email, school_id) DO NOTHING;

-- Insert 5 students linked to the 5 inserted users
INSERT INTO students (school_id, user_id, student_number, registration_number, date_of_birth, gender, nationality)
SELECT s.school_id, u.user_id,
       ('S' || LPAD((ROW_NUMBER() OVER (ORDER BY u.user_id))::text,4,'0')),
       ('R' || LPAD((ROW_NUMBER() OVER (ORDER BY u.user_id))::text,4,'0')),
      (CURRENT_DATE - ((365 * (10 + (ROW_NUMBER() OVER (ORDER BY u.user_id)))) * INTERVAL '1 day'))::date,
       CASE ((ROW_NUMBER() OVER (ORDER BY u.user_id)) % 2) WHEN 0 THEN 'female' ELSE 'male' END,
       'Rwandan'
FROM users u
JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s ON true
ORDER BY u.user_id
LIMIT 5
ON CONFLICT (student_number, school_id) DO NOTHING;

-- Insert 5 guardians (one per student)
INSERT INTO guardians (school_id, student_id, first_name, last_name, relationship, phone, email, is_primary)
SELECT s.school_id, st.student_id, 'Guardian' || i, 'Seed', 'guardian', '+250780000' || i, 'guardian' || i || '@demo.edu', TRUE
FROM (
  SELECT student_id, ROW_NUMBER() OVER (ORDER BY student_id) AS i FROM students
  ORDER BY student_id LIMIT 5
) st
CROSS JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s
ON CONFLICT DO NOTHING;

-- Insert 5 academic years
INSERT INTO academic_years (school_id, name, code, start_date, end_date, is_current, status)
SELECT s.school_id, v.name, v.code, v.start_date, v.end_date, v.is_current, v.status
FROM (VALUES
  ('2022/2023','AY22','2022-09-01'::date,'2023-06-30'::date,FALSE,'completed'),
  ('2023/2024','AY23','2023-09-01'::date,'2024-06-30'::date,TRUE,'active'),
  ('2024/2025','AY24','2024-09-01'::date,'2025-06-30'::date,FALSE,'planned'),
  ('2021/2022','AY21','2021-09-01'::date,'2022-06-30'::date,FALSE,'archived'),
  ('2025/2026','AY25','2025-09-01'::date,'2026-06-30'::date,FALSE,'planned')
) AS v(name,code,start_date,end_date,is_current,status)
CROSS JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s
ON CONFLICT (name, school_id) DO NOTHING;

-- Insert 5 class levels
INSERT INTO class_levels (school_id, level_name, level_code, education_level, sort_order)
SELECT s.school_id, v.level_name, v.level_code, v.education_level, v.sort_order
FROM (VALUES
  ('Grade 1','G1','primary',1),
  ('Grade 2','G2','primary',2),
  ('Grade 3','G3','primary',3),
  ('Grade 4','G4','primary',4),
  ('Grade 5','G5','primary',5)
) AS v(level_name,level_code,education_level,sort_order)
CROSS JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s
ON CONFLICT (level_name, school_id) DO NOTHING;

-- Insert 5 streams
INSERT INTO streams (school_id, stream_name, stream_code, description)
SELECT s.school_id, v.stream_name, v.stream_code, v.description
FROM (VALUES
  ('Science','SCI','Science stream'),
  ('Arts','ART','Arts stream'),
  ('Commercial','COM','Commercial stream'),
  ('ICT','ICT','Information and Communication Tech'),
  ('Home Economics','HOME','Home Economics')
) AS v(stream_name,stream_code,description)
CROSS JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s
ON CONFLICT (stream_name, school_id) DO NOTHING;

-- Insert 5 subjects
INSERT INTO subjects (school_id, subject_code, subject_name, coefficient, category)
SELECT s.school_id, v.code, v.name, v.coeff, v.category
FROM (VALUES
  ('MAT','Mathematics',1.5,'science'),
  ('ENG','English',1.0,'language'),
  ('SCI','Science',1.2,'science'),
  ('HIS','History',1.0,'arts'),
  ('CS','Computer Studies',1.3,'commercial')
) AS v(code,name,coeff,category)
CROSS JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s
ON CONFLICT (subject_code, school_id) DO NOTHING;

-- Insert 5 classes (one per level)
INSERT INTO classes (school_id, academic_year_id, level_id, class_name, section, capacity)
SELECT s.school_id, ay.academic_year_id, cl.level_id, cl.level_name || ' - A', 'A', 30
FROM class_levels cl
JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s ON cl.school_id = s.school_id
JOIN academic_years ay ON ay.school_id = s.school_id
WHERE cl.level_name IN ('Grade 1','Grade 2','Grade 3','Grade 4','Grade 5')
AND ay.is_current = TRUE
ON CONFLICT (class_name, school_id, academic_year_id) DO NOTHING;

-- Insert 5 academic periods for the current academic year
INSERT INTO academic_periods (school_id, academic_year_id, period_type, period_number, name, start_date, end_date, weight)
SELECT s.school_id, ay.academic_year_id, 'term', v.period_number, 'Term ' || v.period_number, v.start_date, v.end_date, 1.00
FROM (VALUES
  (1,'2023-09-01'::date,'2023-11-30'::date),
  (2,'2024-01-05'::date,'2024-03-31'::date),
  (3,'2024-04-15'::date,'2024-06-30'::date),
  (4,'2024-07-01'::date,'2024-08-31'::date),
  (5,'2024-09-01'::date,'2024-11-30'::date)
) AS v(period_number,start_date,end_date)
CROSS JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s
JOIN academic_years ay ON ay.school_id = s.school_id AND ay.is_current = TRUE
ON CONFLICT DO NOTHING;

-- Insert 5 class_subjects linking existing classes and subjects and a teacher
INSERT INTO class_subjects (school_id, class_id, subject_id, coefficient, max_mark, teacher_id)
SELECT s.school_id, c.class_id, sub.subject_id, 1.0, 20.00,
       (SELECT user_id FROM users ORDER BY user_id LIMIT 1)
FROM classes c
JOIN subjects sub ON sub.school_id = c.school_id
JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s ON c.school_id = s.school_id
LIMIT 5
ON CONFLICT (class_id, subject_id) DO NOTHING;

-- Insert 5 enrollments for the 5 students into available classes
INSERT INTO enrollments (school_id, student_id, class_id, academic_year_id, enrollment_date, status)
SELECT s.school_id, st.student_id, c.class_id, ay.academic_year_id, (CURRENT_DATE - (ROW_NUMBER() OVER (ORDER BY st.student_id) * INTERVAL '1 day'))::date,
       'active'
FROM students st
CROSS JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s
JOIN classes c ON c.school_id = s.school_id
JOIN academic_years ay ON ay.school_id = s.school_id AND ay.is_current = TRUE
ORDER BY st.student_id
LIMIT 5
ON CONFLICT (student_id, academic_year_id) DO NOTHING;

-- Insert 5 fee structures
INSERT INTO fee_structures (school_id, academic_year_id, level_id, fee_type, amount, is_mandatory, created_by)
SELECT s.school_id, ay.academic_year_id, cl.level_id, v.fee_type, v.amount, TRUE, (SELECT user_id FROM users ORDER BY user_id LIMIT 1)
FROM (VALUES
  ('Tuition',500.00),
  ('Exam',50.00),
  ('Library',20.00),
  ('Lab',30.00),
  ('Sports',15.00)
) AS v(fee_type,amount)
CROSS JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s
JOIN academic_years ay ON ay.school_id = s.school_id AND ay.is_current = TRUE
JOIN class_levels cl ON cl.school_id = s.school_id
LIMIT 5
ON CONFLICT DO NOTHING;

-- Insert 5 enrollments_fees (expected amounts) for enrollments
INSERT INTO enrollments_fees (enrollment_id, fee_structure_id, amount_expected, amount_paid, status)
SELECT e.enrollment_id, fs.fee_structure_id, fs.amount, 0.00, 'pending'
FROM enrollments e
JOIN fee_structures fs ON fs.school_id = e.school_id
LIMIT 5
ON CONFLICT DO NOTHING;

-- Insert 5 payments for the enrollments_fees
INSERT INTO payments (school_id, student_id, enrollment_fee_id, amount, payment_date, payment_method, receipt_number, recorded_by, status)
SELECT e.school_id, e.student_id, ef.enrollment_fee_id, ef.amount_expected/2.0, CURRENT_DATE, 'cash', 'RCPT-'||substr(md5(random()::text),1,8), (SELECT user_id FROM users ORDER BY user_id LIMIT 1), 'completed'
FROM enrollments e
JOIN enrollments_fees ef ON ef.enrollment_id = e.enrollment_id
LIMIT 5
ON CONFLICT DO NOTHING;

-- Insert 5 grades
INSERT INTO grades (school_id, student_id, class_subject_id, period_id, score_raw, score_normalized, entered_by)
SELECT s.school_id, e.student_id, cs.class_subject_id, ap.period_id, 12 + (ROW_NUMBER() OVER (ORDER BY e.enrollment_id))*1.5, 60 + (ROW_NUMBER() OVER (ORDER BY e.enrollment_id))*2, (SELECT user_id FROM users ORDER BY user_id LIMIT 1)
FROM enrollments e
JOIN class_subjects cs ON cs.class_id = e.class_id
JOIN academic_periods ap ON ap.academic_year_id = e.academic_year_id
JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s ON e.school_id = s.school_id
LIMIT 5
ON CONFLICT DO NOTHING;

-- Insert 5 report_cards
INSERT INTO report_cards (school_id, student_id, class_id, academic_year_id, total_marks, average, rank, remarks, generated_by)
SELECT e.school_id, e.student_id, e.class_id, e.academic_year_id, 300, 75.0, 1, 'Good progress', (SELECT user_id FROM users ORDER BY user_id LIMIT 1)
FROM enrollments e
LIMIT 5
ON CONFLICT DO NOTHING;

-- Insert 5 report_card_details
INSERT INTO report_card_details (report_card_id, class_subject_id, score, grade)
SELECT rc.report_card_id, cs.class_subject_id, 15 + (ROW_NUMBER() OVER (ORDER BY rc.report_card_id)), 'A'
FROM report_cards rc
JOIN class_subjects cs ON cs.class_id = rc.class_id
LIMIT 5
ON CONFLICT DO NOTHING;

-- Insert 5 attendance records
INSERT INTO attendance (school_id, student_id, class_id, date, status, minutes_late, recorded_by)
SELECT e.school_id, e.student_id, e.class_id, (CURRENT_DATE - (ROW_NUMBER() OVER (ORDER BY e.enrollment_id) * INTERVAL '1 day'))::date, 'present', 0, (SELECT user_id FROM users ORDER BY user_id LIMIT 1)
FROM enrollments e
LIMIT 5
ON CONFLICT DO NOTHING;

-- Insert 5 notifications
INSERT INTO notifications (school_id, user_id, type, title, message)
SELECT s.school_id, u.user_id, 'system', 'Welcome', 'Welcome to the seeded Akademee instance.'
FROM users u
JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s ON u.school_id = s.school_id
LIMIT 5
ON CONFLICT DO NOTHING;

-- Insert 5 audit_logs
INSERT INTO audit_logs (school_id, user_id, action, entity_type, entity_id)
SELECT s.school_id, u.user_id, 'seed:insert', 'system', NULL
FROM users u
JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s ON u.school_id = s.school_id
LIMIT 5;

-- Insert 5 offline sync queue entries
INSERT INTO offline_sync_queue (school_id, user_id, device_id, operation, payload)
SELECT s.school_id, u.user_id, 'device-'||ROW_NUMBER() OVER (ORDER BY u.user_id), 'create', jsonb_build_object('entity','student','id',uuid_generate_v4())
FROM users u
JOIN (SELECT school_id FROM schools ORDER BY created_at LIMIT 1) s ON u.school_id = s.school_id
LIMIT 5;

-- Assign 5 user_roles sample assignments
INSERT INTO user_roles (user_id, role_id, assigned_by)
SELECT u.user_id, r.role_id, u.user_id
FROM users u
CROSS JOIN (SELECT role_id FROM roles LIMIT 5) r
LIMIT 5
ON CONFLICT DO NOTHING;

-- Final note: seeds are idempotent where possible (ON CONFLICT DO NOTHING)
