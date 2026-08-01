-- ============================================================================
-- AKADEMEE — GÉNÉRATEUR DE DONNÉES EN VOLUME (SQL)
-- ============================================================================
-- Injecte une grosse quantité de données réalistes pour tester les
-- performances : plusieurs écoles, utilisateurs, élèves, classes, notes,
-- paiements, présences, notifications, annonces, etc.
--
-- EXÉCUTION :
--   Option A (psql)  : psql "$DATABASE_URL" -f scripts/seed-bulk.sql
--   Option B (node)  : node scripts/run-seed-bulk.js
--                      (supporte les variables d'env SEED_* pour surcharger
--                       les compteurs ci-dessous, voir run-seed-bulk.js)
--
-- SÉCURITÉ : l'intégralité du script s'exécute dans UNE SEULE transaction.
-- En cas d'erreur, TOUT est annulé (rollback). Les écoles dont le sous-domaine
-- existe déjà sont ignorées (idempotent → on peut relancer sans doublons).
--
-- Mot de passe de TOUS les comptes créés : Akademee@2025
-- (hash bcrypt identique à celui de scripts/seed-schools.js)
-- ============================================================================

DO $do$
DECLARE
    -- ══════════════════════════════════════════════════════════════════════
    -- CONFIGURATION — MODIFIE CES VALEURS SELON LE VOLUME SOUHAITÉ
    -- ══════════════════════════════════════════════════════════════════════
    v_nb_schools            INT  := 3;    -- nombre d'écoles à créer
    v_nb_classes            INT  := 12;   -- classes par école
    v_nb_students_per_class INT  := 30;   -- élèves par classe
    v_nb_teachers           INT  := 8;    -- enseignants par école
    v_nb_accountants        INT  := 2;    -- comptables par école
    v_nb_subjects           INT  := 14;   -- matières par école
    v_subjects_per_class    INT  := 10;   -- matières affectées à chaque classe
    v_attendance_days       INT  := 15;   -- jours de présence générés par élève
    v_payments_per_student  INT  := 3;    -- paiements par élève
    v_sequences_for_grades  INT  := 4;    -- nb de séquences notées (2 × T1 + 2 × T2)
    v_prefix                TEXT := 'perf'; -- préfixe des sous-domaines (perf1, perf2…)
    v_password_hash         TEXT := '$2b$10$04DX.gjZspoCi8X1IV6jNOAi.3lC3YricXk2COLxCmDpOHJEVwiY.';
    -- ══════════════════════════════════════════════════════════════════════

    -- Variables internes (ne pas toucher)
    v_school_id         UUID;
    v_school_short      TEXT;
    v_admin_id          UUID;
    v_year_id           UUID;
    v_user_id           UUID;
    v_student_id        UUID;
    v_teacher_ids       UUID[] := ARRAY[]::UUID[];
    v_class_ids         UUID[] := ARRAY[]::UUID[];
    v_subject_ids       UUID[] := ARRAY[]::UUID[];
    v_period_ids        UUID[] := ARRAY[]::UUID[];
    v_sequence_ids      UUID[] := ARRAY[]::UUID[];
    v_class_id          UUID;
    v_subject_id        UUID;
    v_seq_id            UUID;
    v_gidx              INT   := 0;
    v_ci                INT;
    v_si                INT;
    v_ji                INT;
    v_ki                INT;
    v_year_start        DATE  := '2024-09-02';
    v_year_end          DATE  := '2025-06-30';
    v_birth_year        INT;
    v_first_name        TEXT;
    v_last_name         TEXT;
    v_login_email       TEXT;

    -- Pools de noms
    v_first_names       TEXT[] := ARRAY['Jean','Marie','Pierre','Rose','Paul','Anne','Jacques','Claire','Michel','Louise','Thomas','Françoise','Joseph','Pauline','David','Thérèse','Emmanuel','Bernadette','Samuel','Cécile','André','Denise','François','Élisabeth','Alain','Geneviève','Louis','Henriette','Charles','Irène','Henri','Jacqueline'];
    v_last_names        TEXT[] := ARRAY['Ngo','Biloa','Tchinda','Simo','Njike','Atangana','Nkili','Eyenga','Owona','Fouda','Ngono','Etoa','Zanga','Eboué','Mbarga','Momo','Ntsama','Bodo','Mengue','Nkoa','Biyong','Essono','Mvondo','Ewolo','Mbah','Nkengue','Nlend','Tadjou','Mefire','Ndjock','Yomi','Ekanga'];
    v_class_names       TEXT[] := ARRAY['6ème A','6ème B','5ème A','5ème B','4ème A','4ème B','3ème A','3ème B','2nde A','2nde B','1ère A','1ère B','Terminale A','Terminale B'];
    v_subject_names     TEXT[] := ARRAY['Français','Mathématiques','Anglais','Histoire-Géographie','Physique-Chimie','Sciences de la Vie et de la Terre','Philosophie','Éducation Physique et Sportive','Informatique','Allemand','Espagnol','Éducation à la Citoyenneté','Arts Plastiques','Musique'];
    v_subject_coeffs    NUMERIC[] := ARRAY[5,5,4,3,3,3,2,2,2,2,2,1,1,1];
    v_fee_names         TEXT[] := ARRAY['Frais de scolarité','Frais d''inscription','Assurance scolaire','Frais d''examen','Contribution PTA','Frais de transport'];
    v_fee_amounts       NUMERIC[] := ARRAY[150000,25000,15000,10000,5000,20000];
    v_level_names       TEXT[] := ARRAY['6e','5e','4e','3e','2nde','1ère','Terminale'];
    v_series_names      TEXT[] := ARRAY['Série Générale','Série Technique'];
    v_relationships     TEXT[] := ARRAY['father','mother','guardian','other'];
    v_genders           TEXT[] := ARRAY['male','female'];
    v_att_statuses      TEXT[] := ARRAY['present','present','present','present','absent','late','excused'];
    v_pay_methods       TEXT[] := ARRAY['cash','mobile_money','bank_transfer','cheque'];
    v_level_ids         UUID[] := ARRAY[]::UUID[];
    v_series_ids        UUID[] := ARRAY[]::UUID[];
    v_level_id          UUID;
    v_series_id         UUID;
BEGIN
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE ' AKADEMEE — SEED BULK DATA (début)';
    RAISE NOTICE ' % école(s) × % classe(s) × % élève(s)/classe', v_nb_schools, v_nb_classes, v_nb_students_per_class;
    RAISE NOTICE '═══════════════════════════════════════════════════════';

    -- ── Vérifier que les rôles existent ───────────────────────────────────
    INSERT INTO roles (role_name, role_code)
    SELECT r, r FROM unnest(ARRAY['SUPER_ADMIN','ADMIN','TEACHER','ACCOUNTANT','STUDENT','GUARDIAN','STAFF']) AS r
    ON CONFLICT (role_code) DO NOTHING;

    -- ── Boucle sur les écoles ─────────────────────────────────────────────
    FOR v_ci IN 1..v_nb_schools LOOP
        v_school_short := v_prefix || v_ci;

        -- Idempotence : sauter si le sous-domaine existe déjà
        IF EXISTS (SELECT 1 FROM schools WHERE subdomain = v_school_short) THEN
            RAISE NOTICE 'École % déjà présente → ignorée', v_school_short;
            CONTINUE;
        END IF;

        -- ── 1. École + année académique ────────────────────────────────────
        INSERT INTO schools (
            name, tagline, subdomain, email, phone, address, city, region,
            primary_color, academic_system, subscription_plan, subscription_status,
            is_active, email_verified, require_email_verification, onboarding_completed,
            website_published, year_founded, website_description, website_stats,
            website_values, educational_systems, exam_type, exam_pass_rate,
            ranking, ranking_city, about_photos, classes_config, created_at
        ) VALUES (
            'École Test Perf ' || v_ci, 'Données de performance', v_school_short,
            'contact@' || v_school_short || '.cm', '+237 600 000 00' || v_ci,
            'Boulevard de Test', 'Yaoundé', 'Centre',
            '#085041', 'TERM_SEQUENCE', 'premium', 'active',
            TRUE, TRUE, FALSE, TRUE,
            TRUE, '2000', 'École générée pour les tests de performance',
            jsonb_build_object('students', v_nb_classes * v_nb_students_per_class, 'teachers', v_nb_teachers, 'classes', v_nb_classes),
            jsonb_build_array('Excellence','Discipline','Innovation'),
            jsonb_build_array('francophone_general','anglophone_general'),
            'BACC / GCE', '90%', 'Top 10', 'Yaoundé', jsonb_build_array(), jsonb_build_object(), NOW()
        ) RETURNING school_id INTO v_school_id;

        INSERT INTO academic_years (school_id, name, start_date, end_date, is_current, created_at)
        VALUES (v_school_id, '2024-2025', v_year_start, v_year_end, TRUE, NOW())
        RETURNING academic_year_id INTO v_year_id;

        RAISE NOTICE 'École % créée (school_id %)', v_school_short, v_school_id;

        -- ── 2. Admin ────────────────────────────────────────────────────────
        INSERT INTO users (
            school_id, first_name, last_name, email, login_email, password_hash,
            phone, is_active, email_verified, require_email_verification, gender, date_of_birth, created_at
        ) VALUES (
            v_school_id, 'Admin', 'Principal', 'admin@' || v_school_short || '.cm',
            'admin@' || v_school_short || '.cm', v_password_hash,
            '+237 611 111 1' || v_ci, TRUE, TRUE, FALSE, 'male', '1980-01-01', NOW()
        ) RETURNING user_id INTO v_admin_id;

        INSERT INTO user_roles (user_id, role_id)
        SELECT v_admin_id, role_id FROM roles WHERE role_code = 'ADMIN';

        -- ── 3. Niveaux & séries (système scolaire) ───────────────────────────
        v_level_ids := ARRAY[]::UUID[];
        FOR v_ji IN 1..array_length(v_level_names, 1) LOOP
            INSERT INTO system_levels (school_id, name, sort_order)
            VALUES (v_school_id, v_level_names[v_ji], v_ji)
            RETURNING level_id INTO v_level_id;
            v_level_ids := v_level_ids || v_level_id;
        END LOOP;

        v_series_ids := ARRAY[]::UUID[];
        FOR v_ji IN 1..array_length(v_series_names, 1) LOOP
            INSERT INTO system_series (school_id, name)
            VALUES (v_school_id, v_series_names[v_ji])
            RETURNING series_id INTO v_series_id;
            v_series_ids := v_series_ids || v_series_id;
        END LOOP;

        -- ── 4. Enseignants & comptables ──────────────────────────────────────
        v_teacher_ids := ARRAY[]::UUID[];
        FOR v_ji IN 1..v_nb_teachers LOOP
            v_first_name := v_first_names[((v_ci - 1) * v_nb_teachers + v_ji) % array_length(v_first_names, 1) + 1];
            v_last_name  := v_last_names[((v_ci - 1) * v_nb_teachers + v_ji) % array_length(v_last_names, 1) + 1];
            v_login_email := 'teacher' || v_ji || '.teacher@' || v_school_short || '.cm';
            INSERT INTO users (
                school_id, first_name, last_name, email, login_email, password_hash,
                phone, is_active, email_verified, require_email_verification,
                gender, date_of_birth, employee_number, date_of_hired, qualification, created_at
            ) VALUES (
                v_school_id, v_first_name, v_last_name,
                'teacher' || v_ji || '@' || v_school_short || '.cm', v_login_email, v_password_hash,
                '+237 622 222 2' || v_ji, TRUE, TRUE, FALSE,
                v_genders[v_ji % 2 + 1], make_date(1985, v_ji % 12 + 1, 15),
                'EMP-' || v_ci || '-' || lpad(v_ji::text, 3, '0'), '2020-09-01', 'Licence', NOW()
            ) RETURNING user_id INTO v_user_id;
            INSERT INTO user_roles (user_id, role_id)
            SELECT v_user_id, role_id FROM roles WHERE role_code = 'TEACHER';
            v_teacher_ids := v_teacher_ids || v_user_id;
        END LOOP;

        FOR v_ji IN 1..v_nb_accountants LOOP
            INSERT INTO users (
                school_id, first_name, last_name, email, login_email, password_hash,
                phone, is_active, email_verified, require_email_verification, created_at
            ) VALUES (
                v_school_id, 'Comptable', v_ji,
                'accountant' || v_ji || '@' || v_school_short || '.cm',
                'accountant' || v_ji || '.accountant@' || v_school_short || '.cm', v_password_hash,
                '+237 633 333 3' || v_ji, TRUE, TRUE, FALSE, NOW()
            ) RETURNING user_id INTO v_user_id;
            INSERT INTO user_roles (user_id, role_id)
            SELECT v_user_id, role_id FROM roles WHERE role_code = 'ACCOUNTANT';
        END LOOP;

        -- ── 5. Matières ──────────────────────────────────────────────────────
        v_subject_ids := ARRAY[]::UUID[];
        FOR v_ji IN 1..v_nb_subjects LOOP
            INSERT INTO subjects (
                school_id, name, name_fr, name_en, code, coefficient, credits,
                level, series, category, applicable_systems
            ) VALUES (
                v_school_id, v_subject_names[v_ji], v_subject_names[v_ji], v_subject_names[v_ji],
                'SUB-' || v_ci || '-' || lpad(v_ji::text, 2, '0'),
                v_subject_coeffs[v_ji], 1,
                v_level_names[((v_ji - 1) % array_length(v_level_names, 1)) + 1],
                v_series_names[1], 'CORE',
                ARRAY['FR_GEN','ANG_GEN']
            ) RETURNING subject_id INTO v_subject_id;
            v_subject_ids := v_subject_ids || v_subject_id;
        END LOOP;

        -- ── 6. Classes + affectation prof principal ───────────────────────────
        v_class_ids := ARRAY[]::UUID[];
        FOR v_ji IN 1..v_nb_classes LOOP
            INSERT INTO classes (
                school_id, academic_year_id, name, capacity, level_id, series_id,
                education_system_id, credit_bearing, class_teacher_id, updated_at
            ) VALUES (
                v_school_id, v_year_id, v_class_names[((v_ji - 1) % array_length(v_class_names, 1)) + 1],
                v_nb_students_per_class,
                v_level_ids[((v_ji - 1) % array_length(v_level_ids, 1)) + 1],
                v_series_ids[((v_ji - 1) % array_length(v_series_ids, 1)) + 1],
                NULL, FALSE, v_teacher_ids[((v_ji - 1) % v_nb_teachers) + 1], NOW()
            ) RETURNING class_id INTO v_class_id;
            v_class_ids := v_class_ids || v_class_id;
        END LOOP;

        -- ── 7. Périodes (trimestres) + séquences ───────────────────────────────
        v_period_ids := ARRAY[]::UUID[];
        v_sequence_ids := ARRAY[]::UUID[];
        FOR v_ji IN 1..3 LOOP
            INSERT INTO periods (
                school_id, academic_year_id, name, label_fr, label_en, type,
                start_date, end_date, is_current, sort_order, order_index, weight,
                status, system_type, created_at, updated_at
            ) VALUES (
                v_school_id, v_year_id,
                'Trimestre ' || v_ji, 'Trimestre ' || v_ji, 'Term ' || v_ji, 'term',
                (v_year_start + ((v_ji - 1) * 4 || ' months')::interval)::date,
                (v_year_start + ((v_ji - 1) * 4 + 3 || ' months')::interval)::date,
                v_ji = 1, v_ji, v_ji, 1,
                CASE WHEN v_ji = 1 THEN 'OUVERTE' ELSE 'EN_ATTENTE' END,
                'TERM_SEQUENCE', NOW(), NOW()
            ) RETURNING period_id INTO v_class_id;
            v_period_ids := v_period_ids || v_class_id;

            -- 2 séquences par trimestre
            FOR v_ki IN 1..2 LOOP
                INSERT INTO sequences (
                    school_id, period_id, label, date_debut, date_fin, status, sort_order, created_at, updated_at
                ) VALUES (
                    v_school_id, v_class_id,
                    'Séquence ' || v_ki || ' — Trimestre ' || v_ji,
                    (v_year_start + ((v_ji - 1) * 4 + (v_ki - 1) * 2 || ' months')::interval)::date,
                    (v_year_start + ((v_ji - 1) * 4 + (v_ki - 1) * 2 + 1 || ' months')::interval)::date,
                    CASE WHEN v_ji = 1 THEN 'OUVERTE' ELSE 'EN_ATTENTE' END,
                    (v_ji - 1) * 2 + v_ki, NOW(), NOW()
                ) RETURNING sequence_id INTO v_seq_id;
                v_sequence_ids := v_sequence_ids || v_seq_id;
            END LOOP;
        END LOOP;

        -- ── 8. Class_subjects + subject_teachers ────────────────────────────────
        FOR v_ji IN 1..array_length(v_class_ids, 1) LOOP
            FOR v_ki IN 1..LEAST(v_subjects_per_class, v_nb_subjects) LOOP
                INSERT INTO class_subjects (school_id, class_id, subject_id, coefficient, is_compulsory, created_at)
                VALUES (v_school_id, v_class_ids[v_ji], v_subject_ids[v_ki], v_subject_coeffs[v_ki], TRUE, NOW())
                ON CONFLICT (class_id, subject_id) DO NOTHING;

                INSERT INTO subject_teachers (school_id, subject_id, teacher_id, class_id, created_at)
                VALUES (
                    v_school_id, v_subject_ids[v_ki],
                    v_teacher_ids[((v_ji + v_ki) % v_nb_teachers) + 1],
                    v_class_ids[v_ji], NOW()
                )
                ON CONFLICT (subject_id, teacher_id, class_id) DO NOTHING;
            END LOOP;
        END LOOP;

        -- ── 9. Élèves (users + students + guardians + enrollments) ──────────────
        v_gidx := 0;
        FOR v_ji IN 1..array_length(v_class_ids, 1) LOOP
            FOR v_si IN 1..v_nb_students_per_class LOOP
                v_gidx := v_gidx + 1;
                v_first_name := v_first_names[(v_ci * 100 + v_gidx) % array_length(v_first_names, 1) + 1];
                v_last_name  := v_last_names[(v_ci * 100 + v_gidx * 3) % array_length(v_last_names, 1) + 1];
                v_birth_year := 2025 - (10 + v_ji);
                v_login_email := 'student' || v_gidx || '.student@' || v_school_short || '.cm';

                -- Compte utilisateur
                INSERT INTO users (
                    school_id, first_name, last_name, email, login_email, password_hash,
                    phone, is_active, email_verified, require_email_verification,
                    gender, date_of_birth, created_at
                ) VALUES (
                    v_school_id, v_first_name, v_last_name,
                    'student' || v_gidx || '@' || v_school_short || '.cm', v_login_email, v_password_hash,
                    '+237 655 555 5' || (v_gidx % 10), TRUE, TRUE, FALSE,
                    v_genders[v_gidx % 2 + 1],
                    make_date(v_birth_year, (v_gidx % 12) + 1, (v_gidx % 27) + 1), NOW()
                ) RETURNING user_id INTO v_user_id;

                INSERT INTO user_roles (user_id, role_id)
                SELECT v_user_id, role_id FROM roles WHERE role_code = 'STUDENT';

                -- Fiche élève
                INSERT INTO students (
                    school_id, user_id, student_number, registration_number,
                    date_of_birth, gender, status, class_label, fee_status,
                    educational_system, created_at, updated_at
                ) VALUES (
                    v_school_id, v_user_id,
                    'ST-' || upper(v_school_short) || '-' || lpad(v_gidx::text, 4, '0'),
                    'REG-' || upper(v_school_short) || '-' || lpad(v_gidx::text, 4, '0'),
                    make_date(v_birth_year, (v_gidx % 12) + 1, (v_gidx % 27) + 1),
                    v_genders[v_gidx % 2 + 1]::gender_enum, 'active',
                    v_class_names[((v_ji - 1) % array_length(v_class_names, 1)) + 1],
                    'pending', 'francophone_general', NOW(), NOW()
                ) RETURNING student_id INTO v_student_id;

                -- Parent / tuteur
                INSERT INTO guardians (
                    school_id, student_id, name, relationship, phone, email
                ) VALUES (
                    v_school_id, v_student_id,
                    v_last_names[(v_gidx * 7) % array_length(v_last_names, 1) + 1] || ' ' || v_first_names[(v_gidx * 5) % array_length(v_first_names, 1) + 1],
                    v_relationships[v_gidx % array_length(v_relationships, 1) + 1]::relationship_enum,
                    '+237 677 777 7' || (v_gidx % 10),
                    'parent' || v_gidx || '@' || v_school_short || '.cm'
                );

                -- Inscription
                INSERT INTO enrollments (
                    school_id, student_id, class_id, academic_year_id,
                    status, enrollment_number, enrolled_by, enrolled_from, updated_at
                ) VALUES (
                    v_school_id, v_student_id, v_class_ids[v_ji], v_year_id,
                    'active', 'ENR-' || upper(v_school_short) || '-' || lpad(v_gidx::text, 4, '0'),
                    v_admin_id, v_year_start, NOW()
                );
            END LOOP;
        END LOOP;

        -- ── 10. Frais + affectation student_fees ─────────────────────────────────
        FOR v_ji IN 1..array_length(v_fee_names, 1) LOOP
            INSERT INTO fees (
                school_id, name, amount, description, class_id, academic_year_id,
                due_date, is_active, created_at
            ) VALUES (
                v_school_id, v_fee_names[v_ji], v_fee_amounts[v_ji], 'Frais générés en masse',
                CASE WHEN v_ji IN (3, 6) THEN v_class_ids[(v_ji % array_length(v_class_ids, 1)) + 1] ELSE NULL END,
                v_year_id, '2024-10-15', TRUE, NOW()
            );
        END LOOP;

        INSERT INTO student_fees (school_id, student_id, fee_id, amount_due, amount_paid, status, academic_year_id, created_at, updated_at)
        SELECT
            e.school_id, e.student_id, f.fee_id, f.amount,
            CASE
                WHEN random() < 0.60 THEN f.amount
                WHEN random() < 0.85 THEN round(f.amount * 0.5, 2)
                ELSE 0
            END,
            CASE
                WHEN random() < 0.60 THEN 'paid'
                WHEN random() < 0.85 THEN 'partial'
                ELSE 'pending'
            END,
            e.academic_year_id, NOW(), NOW()
        FROM enrollments e
        JOIN fees f ON f.school_id = e.school_id
        WHERE e.school_id = v_school_id;

        -- ── 11. Paiements ─────────────────────────────────────────────────────────
        INSERT INTO payments (
            school_id, student_id, fee_id, amount, method, status,
            receipt_number, academic_year_id, created_at
        )
        SELECT
            e.school_id, e.student_id,
            (SELECT f.fee_id FROM fees f WHERE f.school_id = e.school_id ORDER BY random() LIMIT 1),
            round((random() * 80000 + 25000)::numeric, -3),
            v_pay_methods[1 + floor(random() * array_length(v_pay_methods, 1))::int]::payment_method_enum,
            (ARRAY['completed','completed','completed','pending'])[1 + floor(random() * 4)::int]::payment_status_enum,
            'RCPT-' || upper(v_school_short) || '-' || lpad(e.student_id::text, 8, '0') || '-' || k,
            e.academic_year_id,
            NOW() - (k || ' days')::interval
        FROM enrollments e
        CROSS JOIN generate_series(1, v_payments_per_student) AS k
        WHERE e.school_id = v_school_id;

        -- ── 12. Notes (grades) — 1 note par élève × matière × séquence ─────────────
        FOR v_ki IN 1..LEAST(v_sequences_for_grades, array_length(v_sequence_ids, 1)) LOOP
            v_seq_id := v_sequence_ids[v_ki];
            INSERT INTO grades (
                school_id, student_id, subject_id, period_id, sequence_id, score,
                status, entered_by, entered_at, created_at
            )
            SELECT
                e.school_id, e.student_id, cs.subject_id, sq.period_id, sq.sequence_id,
                round((random() * 200)::numeric / 10, 1),
                'GRADED', v_teacher_ids[1 + floor(random() * v_nb_teachers)::int], NOW(), NOW()
            FROM enrollments e
            JOIN class_subjects cs ON cs.class_id = e.class_id AND cs.school_id = e.school_id
            JOIN sequences sq ON sq.sequence_id = v_seq_id
            WHERE e.school_id = v_school_id AND e.status = 'active';
        END LOOP;

        -- ── 13. Présences (attendance) — 15 jours ouvrés par élève ────────────────
        INSERT INTO attendance (
            school_id, student_id, class_id, status, date, academic_year_id,
            marked_by, remarks, created_at
        )
        SELECT
            e.school_id, e.student_id, e.class_id,
            v_att_statuses[1 + floor(random() * array_length(v_att_statuses, 1))::int]::attendance_status_enum,
            d.day, e.academic_year_id,
            v_teacher_ids[1 + floor(random() * v_nb_teachers)::int],
            NULL, NOW()
        FROM enrollments e
        CROSS JOIN LATERAL (
            SELECT gs::date AS day
            FROM generate_series(v_year_start, v_year_end, interval '1 day') AS gs
            WHERE EXTRACT(ISODOW FROM gs) < 6
            ORDER BY gs
            LIMIT v_attendance_days
        ) AS d
        WHERE e.school_id = v_school_id;

        -- ── 14. Notifications ─────────────────────────────────────────────────────
        INSERT INTO notifications (school_id, user_id, type, message, is_read, created_at)
        SELECT
            e.school_id, s.user_id,
            (CASE WHEN k = 1 THEN 'payment' ELSE 'attendance' END)::notification_type_enum,
            (CASE WHEN k = 1 THEN 'Paiement enregistré' ELSE 'Présence relevée' END),
            random() < 0.4, NOW() - (k || ' days')::interval
        FROM enrollments e
        JOIN students s ON s.student_id = e.student_id
        CROSS JOIN generate_series(1, 2) AS k
        WHERE e.school_id = v_school_id;

        -- ── 15. Annonces ──────────────────────────────────────────────────────────
        FOR v_ji IN 1..10 LOOP
            INSERT INTO announcements (
                school_id, title, content, target_audience, priority,
                created_by, is_published, published_at, created_at, updated_at
            ) VALUES (
                v_school_id,
                'Annonce ' || v_ji || ' — ' || v_school_short,
                'Contenu de l''annonce ' || v_ji || ' générée en masse pour les tests de performance.',
                (ARRAY['all','teachers','students','parents'])[1 + floor(random() * 4)::int]::announcement_audience_enum,
                (ARRAY['low','normal','high'])[1 + floor(random() * 3)::int]::announcement_priority_enum,
                v_admin_id, TRUE, NOW() - (v_ji || ' days')::interval, NOW(), NOW()
            );
        END LOOP;

        -- ── 16. Examens + inscriptions ────────────────────────────────────────────
        INSERT INTO exams (
            school_id, name, exam_type, academic_year_id, registration_start,
            registration_end, exam_start_date, exam_end_date, fee, max_candidates, created_at
        ) VALUES (
            v_school_id, 'Examen Blanc ' || v_ci, 'BEPC', v_year_id,
            v_year_start, v_year_end, v_year_start + interval '3 months', v_year_start + interval '4 months',
            10000, v_nb_classes * v_nb_students_per_class, NOW()
        );

        INSERT INTO exam_registrations (school_id, exam_id, student_id, status, fee_paid, created_at)
        SELECT e.school_id, ex.exam_id, e.student_id, 'registered', TRUE, NOW()
        FROM enrollments e
        JOIN exams ex ON ex.school_id = e.school_id
        WHERE e.school_id = v_school_id
        ON CONFLICT (exam_id, student_id) DO NOTHING;

        -- ── 17. Médias école ──────────────────────────────────────────────────────
        INSERT INTO school_media (school_id, media_type, url, public_id, caption, sort_order, created_at)
        VALUES
            (v_school_id, 'logo', 'https://res.cloudinary.com/akademee/image/upload/v1/schools/' || v_school_short || '-logo.png', NULL, 'Logo', 0, NOW()),
            (v_school_id, 'hero', 'https://res.cloudinary.com/akademee/image/upload/v1/schools/' || v_school_short || '-hero.jpg', NULL, 'Héro', 1, NOW());

        RAISE NOTICE '  ✔ École % terminée : % élèves, % classes, % notes, % paiements',
            v_school_short,
            v_nb_classes * v_nb_students_per_class,
            v_nb_classes,
            v_nb_classes * v_nb_students_per_class * LEAST(v_sequences_for_grades, array_length(v_sequence_ids, 1)) * v_subjects_per_class,
            v_nb_classes * v_nb_students_per_class * v_payments_per_student;
    END LOOP;

    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE ' ✅ SEED BULK DATA TERMINÉ — tous les comptes utilisent le mot de passe : Akademee@2025';
    RAISE NOTICE ' ⚠️  Toute erreur a annulé la transaction (aucune donnée partielle).';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
END
$do$;
