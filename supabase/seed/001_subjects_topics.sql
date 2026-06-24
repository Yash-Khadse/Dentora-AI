-- ============================================================
-- DENTORA AI - Seed Data (idempotent — safe to re-run)
-- BDS Final Year Subjects & Topics (RGUHS)
-- ============================================================

DO $$
DECLARE
  v_college_id UUID;
  om_id UUID; os_id UUID; pedo_id UUID;
  ortho_id UUID; perio_id UUID; pro_id UUID;
BEGIN

SELECT id INTO v_college_id FROM colleges WHERE code = 'MIDS';

IF v_college_id IS NULL THEN
  INSERT INTO colleges (name, code, university, city, state)
  VALUES ('Meghna Institute of Dental Sciences', 'MIDS', 'RGUHS', 'Nizamabad', 'Telangana')
  RETURNING id INTO v_college_id;
END IF;

-- ---- SUBJECTS (idempotent) ----
INSERT INTO subjects (college_id, name, code, description, total_topics, exam_weightage, color, order_index) VALUES
  (v_college_id, 'Oral Medicine and Radiology', 'OM', 'Diagnosis and management of oral diseases, radiographic interpretation', 42, 20, '#3b82f6', 1),
  (v_college_id, 'Oral and Maxillofacial Surgery', 'OS', 'Surgical management of oral and facial conditions', 38, 20, '#ef4444', 2),
  (v_college_id, 'Pedodontics and Preventive Dentistry', 'PDC', 'Dental care for children and preventive approaches', 35, 15, '#10b981', 3),
  (v_college_id, 'Orthodontics and Dentofacial Orthopaedics', 'OPT', 'Correction of dental and facial irregularities', 40, 15, '#8b5cf6', 4),
  (v_college_id, 'Periodontics', 'PER', 'Diseases and treatment of supporting structures of teeth', 36, 15, '#f59e0b', 5),
  (v_college_id, 'Prosthodontics and Crown & Bridge', 'PR', 'Replacement and restoration of missing teeth', 44, 15, '#06b6d4', 6)
ON CONFLICT (college_id, code) DO NOTHING;

SELECT id INTO om_id    FROM subjects WHERE code = 'OM'  AND college_id = v_college_id;
SELECT id INTO os_id    FROM subjects WHERE code = 'OS'  AND college_id = v_college_id;
SELECT id INTO pedo_id  FROM subjects WHERE code = 'PDC' AND college_id = v_college_id;
SELECT id INTO ortho_id FROM subjects WHERE code = 'OPT' AND college_id = v_college_id;
SELECT id INTO perio_id FROM subjects WHERE code = 'PER' AND college_id = v_college_id;
SELECT id INTO pro_id   FROM subjects WHERE code = 'PR'  AND college_id = v_college_id;

-- ---- ORAL MEDICINE TOPICS ----
INSERT INTO topics (subject_id, name, difficulty, estimated_hours, is_important, order_index) VALUES
(om_id, 'White lesions of oral cavity', 'hard', 4, true, 1),
(om_id, 'Red lesions of oral cavity', 'hard', 3, true, 2),
(om_id, 'Vesiculobullous lesions', 'hard', 4, true, 3),
(om_id, 'Pigmented lesions', 'medium', 2, false, 4),
(om_id, 'Diseases of tongue', 'medium', 2, true, 5),
(om_id, 'Salivary gland diseases', 'hard', 4, true, 6),
(om_id, 'Temporomandibular joint disorders', 'hard', 4, true, 7),
(om_id, 'Oral manifestations of systemic diseases', 'hard', 5, true, 8),
(om_id, 'Dental and maxillofacial radiology - basics', 'medium', 3, true, 9),
(om_id, 'Periapical radiographs and techniques', 'medium', 2, true, 10),
(om_id, 'Panoramic radiography (OPG)', 'medium', 2, true, 11),
(om_id, 'Radiographic interpretation of caries', 'easy', 2, true, 12),
(om_id, 'Radiographic interpretation of periodontal disease', 'medium', 2, true, 13),
(om_id, 'Radiation safety and protection', 'easy', 1, true, 14),
(om_id, 'Oral cancer - diagnosis and staging', 'hard', 4, true, 15),
(om_id, 'Premalignant lesions and conditions', 'hard', 3, true, 16)
ON CONFLICT DO NOTHING;

-- ---- ORAL SURGERY TOPICS ----
INSERT INTO topics (subject_id, name, difficulty, estimated_hours, is_important, order_index) VALUES
(os_id, 'Exodontia - principles and techniques', 'medium', 3, true, 1),
(os_id, 'Local anesthesia - agents and techniques', 'hard', 4, true, 2),
(os_id, 'Complications of exodontia', 'hard', 3, true, 3),
(os_id, 'Impacted third molars', 'hard', 5, true, 4),
(os_id, 'Surgical anatomy of oral cavity', 'medium', 3, true, 5),
(os_id, 'Cysts of jaws - classification and management', 'hard', 4, true, 6),
(os_id, 'Odontogenic tumors', 'hard', 4, true, 7),
(os_id, 'Benign non-odontogenic tumors', 'medium', 2, false, 8),
(os_id, 'Fractures of mandible', 'hard', 4, true, 9),
(os_id, 'Fractures of middle third of face', 'hard', 3, true, 10),
(os_id, 'Odontogenic infections', 'hard', 4, true, 11),
(os_id, 'Preprosthetic surgery', 'medium', 3, true, 12),
(os_id, 'Implantology - introduction and principles', 'medium', 3, true, 13),
(os_id, 'Cleft lip and palate', 'medium', 2, true, 14),
(os_id, 'Temporomandibular joint surgery', 'hard', 3, false, 15)
ON CONFLICT DO NOTHING;

-- ---- PEDODONTICS TOPICS ----
INSERT INTO topics (subject_id, name, difficulty, estimated_hours, is_important, order_index) VALUES
(pedo_id, 'Child psychology and behavior management', 'medium', 3, true, 1),
(pedo_id, 'Growth and development of dentition', 'medium', 3, true, 2),
(pedo_id, 'Dental caries in children', 'easy', 2, true, 3),
(pedo_id, 'Pulp therapy in primary teeth', 'hard', 4, true, 4),
(pedo_id, 'Space maintainers', 'medium', 3, true, 5),
(pedo_id, 'Oral habits', 'medium', 2, true, 6),
(pedo_id, 'Fluorides in preventive dentistry', 'medium', 3, true, 7),
(pedo_id, 'Pit and fissure sealants', 'easy', 1, true, 8),
(pedo_id, 'Traumatic injuries to primary teeth', 'hard', 3, true, 9),
(pedo_id, 'Traumatic injuries to permanent teeth in children', 'hard', 4, true, 10),
(pedo_id, 'Special needs dentistry', 'medium', 2, false, 11),
(pedo_id, 'Preventive orthodontics', 'medium', 2, true, 12)
ON CONFLICT DO NOTHING;

-- ---- ORTHODONTICS TOPICS ----
INSERT INTO topics (subject_id, name, difficulty, estimated_hours, is_important, order_index) VALUES
(ortho_id, 'Growth and development of craniofacial complex', 'hard', 4, true, 1),
(ortho_id, 'Cephalometrics', 'hard', 5, true, 2),
(ortho_id, 'Classification of malocclusion - Angles', 'easy', 2, true, 3),
(ortho_id, 'Classification of malocclusion - Deweys, Balards', 'medium', 2, true, 4),
(ortho_id, 'Etiology of malocclusion', 'medium', 3, true, 5),
(ortho_id, 'Diagnosis and treatment planning in orthodontics', 'hard', 4, true, 6),
(ortho_id, 'Removable appliances', 'medium', 4, true, 7),
(ortho_id, 'Fixed appliance therapy - edgewise technique', 'hard', 5, true, 8),
(ortho_id, 'Functional appliances', 'medium', 3, true, 9),
(ortho_id, 'Retention and relapse', 'medium', 2, true, 10),
(ortho_id, 'Surgical orthodontics', 'hard', 3, false, 11),
(ortho_id, 'Management of specific malocclusions', 'hard', 4, true, 12)
ON CONFLICT DO NOTHING;

-- ---- PERIODONTICS TOPICS ----
INSERT INTO topics (subject_id, name, difficulty, estimated_hours, is_important, order_index) VALUES
(perio_id, 'Anatomy of periodontium', 'medium', 3, true, 1),
(perio_id, 'Gingival diseases', 'medium', 3, true, 2),
(perio_id, 'Periodontitis - classification (AAP 2017)', 'hard', 4, true, 3),
(perio_id, 'Systemic factors affecting periodontium', 'hard', 3, true, 4),
(perio_id, 'Periodontal examination and indices', 'medium', 2, true, 5),
(perio_id, 'Scaling and root planing', 'easy', 2, true, 6),
(perio_id, 'Periodontal flap surgeries', 'hard', 4, true, 7),
(perio_id, 'Mucogingival surgeries', 'hard', 3, false, 8),
(perio_id, 'Regenerative periodontal therapy', 'hard', 3, true, 9),
(perio_id, 'Periodontic-endodontic lesions', 'hard', 2, true, 10),
(perio_id, 'Periodontal emergencies', 'medium', 2, true, 11),
(perio_id, 'Implants and peri-implant diseases', 'medium', 3, true, 12)
ON CONFLICT DO NOTHING;

-- ---- PROSTHODONTICS TOPICS ----
INSERT INTO topics (subject_id, name, difficulty, estimated_hours, is_important, order_index) VALUES
(pro_id, 'Complete denture prosthodontics - basics', 'medium', 3, true, 1),
(pro_id, 'Jaw relation records', 'hard', 4, true, 2),
(pro_id, 'Impression techniques for complete dentures', 'medium', 3, true, 3),
(pro_id, 'Arrangement of artificial teeth', 'medium', 2, true, 4),
(pro_id, 'Denture base materials', 'medium', 2, false, 5),
(pro_id, 'Complications of complete dentures', 'hard', 3, true, 6),
(pro_id, 'Removable partial dentures - design', 'hard', 5, true, 7),
(pro_id, 'Kennedy classification', 'easy', 1, true, 8),
(pro_id, 'Fixed partial dentures - principles', 'hard', 4, true, 9),
(pro_id, 'Crown preparations', 'hard', 4, true, 10),
(pro_id, 'Impression materials and techniques', 'medium', 3, true, 11),
(pro_id, 'Provisional restorations', 'medium', 2, false, 12),
(pro_id, 'Implant-supported prostheses', 'hard', 4, true, 13),
(pro_id, 'Occlusion in prosthodontics', 'hard', 4, true, 14),
(pro_id, 'Maxillofacial prosthetics', 'hard', 3, false, 15)
ON CONFLICT DO NOTHING;

-- ---- ACHIEVEMENTS (idempotent) ----
INSERT INTO achievements (name, description, icon, xp_reward, condition_type, condition_value) VALUES
('Welcome Aboard', 'Created your Dentora AI account', '🎉', 50, 'signup', 1),
('Study Starter', 'Completed your first study session', '📚', 100, 'sessions', 1),
('3-Day Streak', 'Studied 3 days in a row', '🔥', 150, 'streak', 3),
('Week Warrior', 'Studied 7 days in a row', '⚡', 300, 'streak', 7),
('Fortnight Fighter', 'Studied 14 days in a row', '💪', 600, 'streak', 14),
('Month Master', 'Studied 30 days in a row', '🏅', 1200, 'streak', 30),
('Viva Victor', 'Completed your first viva session', '🎤', 200, 'viva_sessions', 1),
('Viva Champion', 'Completed 10 viva sessions', '🏆', 500, 'viva_sessions', 10),
('Flash Master', 'Reviewed 100 flashcards', '⚡', 250, 'flashcards', 100),
('Flash Legend', 'Reviewed 500 flashcards', '⭐', 750, 'flashcards', 500),
('Paper Hunter', 'Analyzed your first previous paper', '📄', 200, 'papers', 1),
('Night Owl', 'Studied past 10 PM', '🦉', 100, 'late_session', 1),
('Early Bird', 'Studied before 7 AM', '🌅', 100, 'early_session', 1),
('Topic Terminator', 'Completed all topics in a subject', '✅', 500, 'subject_complete', 1),
('Exam Ready', 'Reached 90% readiness score', '🏆', 1000, 'readiness', 90),
('AI Scholar', 'Completed 10 AI tutor sessions', '🤖', 300, 'ai_sessions', 10),
('Case Solver', 'Completed 5 clinical cases', '🩺', 300, 'cases', 5),
('High Achiever', 'Scored 90%+ in a viva session', '🌟', 400, 'viva_score', 90)
ON CONFLICT (name) DO NOTHING;

END $$;
