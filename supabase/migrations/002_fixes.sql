-- ============================================================
-- DENTORA AI - Migration 002: Bug Fixes & Missing Items
-- ============================================================

-- Add model_answer JSONB column to case_studies (needed by case API)
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS model_answer JSONB;

-- Add investigations alias (API uses investigation_results but prompt uses investigations)
-- The column is already named investigation_results; case API must be fixed to match.

-- Add difficulty_level as alias if needed (DB uses difficulty; API used difficulty_level)
-- Fix handled in code; no schema change needed.

-- ============================================================
-- increment_xp RPC function (called by viva end_session)
-- ============================================================
CREATE OR REPLACE FUNCTION increment_xp(p_user_id UUID, p_xp INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET xp_points = xp_points + p_xp
  WHERE user_id = p_user_id;
END;
$$;

-- ============================================================
-- Seed BDS Final Year Subjects (if not already seeded)
-- Gets college id from the seeded Meghna college
-- ============================================================
DO $$
DECLARE
  college_id UUID;
BEGIN
  SELECT id INTO college_id FROM colleges WHERE code = 'MIDS' LIMIT 1;

  IF college_id IS NOT NULL THEN
    INSERT INTO subjects (college_id, name, code, description, total_topics, exam_weightage, color, order_index)
    VALUES
      (college_id, 'Oral Medicine and Radiology',              'OM',  'Diseases of oral mucosa, radiology, TMJ disorders', 42, 20, '#3b82f6', 1),
      (college_id, 'Oral Surgery',                             'OS',  'Exodontia, impacted teeth, cysts, fractures',       38, 20, '#ef4444', 2),
      (college_id, 'Pedodontics and Preventive Dentistry',     'PDC', 'Child dentistry, caries prevention, pulp therapy',  35, 15, '#10b981', 3),
      (college_id, 'Orthodontics and Dentofacial Orthopaedics','OPT', 'Growth, cephalometrics, malocclusion, appliances',  40, 15, '#8b5cf6', 4),
      (college_id, 'Periodontics',                             'PER', 'Periodontium, gingivitis, surgical therapy',         36, 15, '#f59e0b', 5),
      (college_id, 'Prosthodontics and Crown & Bridge',        'PR',  'Dentures, implants, occlusion, materials',          44, 15, '#06b6d4', 6)
    ON CONFLICT (college_id, code) DO NOTHING;
  END IF;
END;
$$;

-- ============================================================
-- Seed Achievements (if not already seeded)
-- ============================================================
INSERT INTO achievements (name, description, icon, xp_reward, condition_type, condition_value)
VALUES
  ('First Login',        'Welcome to Dentora AI!',                 '🎉', 50,   'login',    1),
  ('Study Starter',      'Complete your first study session',       '📚', 100,  'sessions', 1),
  ('3-Day Streak',       'Study 3 days in a row',                  '🔥', 150,  'streak',   3),
  ('Week Warrior',       'Study 7 days in a row',                  '⚡', 300,  'streak',   7),
  ('Viva Victor',        'Complete your first viva session',        '🎤', 200,  'viva',     1),
  ('Flash Master',       'Review 100 flashcards',                   '⚡', 250,  'flashcards',100),
  ('Paper Hunter',       'Analyze your first previous paper',       '📄', 200,  'papers',   1),
  ('Night Owl',          'Study session after 10 PM',               '🦉', 100,  'time',     22),
  ('Early Bird',         'Study session before 7 AM',               '🌅', 100,  'time',     7),
  ('Topic Terminator',   'Complete all topics in a subject',        '✅', 500,  'topics',   1),
  ('Exam Ready',         'Reach 90% readiness score',               '🏆', 1000, 'readiness',90),
  ('AI Scholar',         'Complete 10 AI tutor sessions',           '🤖', 150,  'tutor',    10)
ON CONFLICT (name) DO NOTHING;
