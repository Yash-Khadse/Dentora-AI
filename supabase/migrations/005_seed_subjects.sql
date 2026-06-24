-- ============================================================
-- DENTORA AI - Seed all 8 BDS Final Year Subjects
-- KNRUHS / Meghna Institute of Dental Sciences
-- Safe to re-run — skips subjects that already exist by code
-- ============================================================

INSERT INTO subjects (code, name, total_topics, exam_weightage, color)
SELECT code, name, total_topics, exam_weightage, color
FROM (VALUES
  ('OM',  'Oral Medicine and Radiology',               42, 20, '#3b82f6'),
  ('OS',  'Oral Surgery',                              38, 20, '#ef4444'),
  ('PDC', 'Pedodontics and Preventive Dentistry',      35, 15, '#10b981'),
  ('OPT', 'Orthodontics and Dentofacial Orthopaedics', 40, 15, '#8b5cf6'),
  ('PER', 'Periodontics',                              36, 15, '#f59e0b'),
  ('PR',  'Prosthodontics and Crown & Bridge',         44, 15, '#06b6d4'),
  ('CDE', 'Conservative Dentistry and Endodontics',    45, 20, '#f97316'),
  ('PHD', 'Public Health Dentistry',                   30, 10, '#84cc16')
) AS v(code, name, total_topics, exam_weightage, color)
WHERE NOT EXISTS (
  SELECT 1 FROM subjects s WHERE s.code = v.code AND s.college_id IS NULL
);
