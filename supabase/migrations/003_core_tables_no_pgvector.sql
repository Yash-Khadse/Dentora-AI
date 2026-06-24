-- ============================================================
-- DENTORA AI - Core Tables (no pgvector required)
-- Run this first to get auth + onboarding working.
-- After enabling the pgvector extension, run 001_initial_schema.sql
-- for the full schema including embeddings.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── COLLEGES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS colleges (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  code       TEXT UNIQUE NOT NULL,
  university TEXT NOT NULL DEFAULT 'RGUHS',
  city       TEXT,
  state      TEXT DEFAULT 'Karnataka',
  country    TEXT DEFAULT 'India',
  logo_url   TEXT,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO colleges (name, code, university, city, state)
VALUES ('Meghna Institute of Dental Sciences', 'MIDS', 'RGUHS', 'Nizamabad', 'Telangana')
ON CONFLICT (code) DO NOTHING;

-- ── USERS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT UNIQUE NOT NULL,
  role       TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'faculty', 'super_admin')),
  college_id UUID REFERENCES colleges(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PROFILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name              TEXT NOT NULL DEFAULT 'New Student',
  avatar_url             TEXT,
  batch_year             INTEGER,
  roll_number            TEXT,
  phone                  TEXT,
  exam_date              DATE,
  target_percentage      INTEGER DEFAULT 75,
  learning_style         TEXT DEFAULT 'visual',
  daily_study_hours      NUMERIC(3,1) DEFAULT 4.0,
  wake_time              TIME DEFAULT '06:00',
  sleep_time             TIME DEFAULT '23:00',
  college_start_time     TIME DEFAULT '09:00',
  college_end_time       TIME DEFAULT '17:00',
  weekly_holidays        TEXT[] DEFAULT ARRAY['sunday'],
  preferred_session_mins INTEGER DEFAULT 45,
  revision_frequency     INTEGER DEFAULT 7,
  xp_points              INTEGER DEFAULT 0,
  total_xp               INTEGER DEFAULT 0,
  study_streak           INTEGER DEFAULT 0,
  current_streak         INTEGER DEFAULT 0,
  longest_streak         INTEGER DEFAULT 0,
  readiness_score        INTEGER DEFAULT 0,
  last_active_date       DATE,
  onboarding_completed   BOOLEAN DEFAULT false,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ── USER SETTINGS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  email_reminders       BOOLEAN DEFAULT true,
  push_notifications    BOOLEAN DEFAULT false,
  daily_reminder_time   TIME DEFAULT '08:00',
  ai_difficulty_level   TEXT DEFAULT 'intermediate',
  preferred_ai_mode     TEXT DEFAULT 'study',
  theme                 TEXT DEFAULT 'system',
  study_goal_hours      INTEGER DEFAULT 4,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── SUBJECTS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id     UUID REFERENCES colleges(id),
  name           TEXT NOT NULL,
  code           TEXT NOT NULL,
  description    TEXT,
  total_topics   INTEGER DEFAULT 0,
  exam_weightage INTEGER DEFAULT 15,
  color          TEXT DEFAULT '#3b82f6',
  icon           TEXT,
  order_index    INTEGER DEFAULT 0,
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (college_id, code)
);

-- ── TOPICS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topics (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id      UUID REFERENCES subjects(id) ON DELETE CASCADE,
  parent_topic_id UUID REFERENCES topics(id),
  name            TEXT NOT NULL,
  description     TEXT,
  difficulty      TEXT DEFAULT 'medium',
  estimated_hours NUMERIC(3,1) DEFAULT 2.0,
  is_important    BOOLEAN DEFAULT false,
  order_index     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── STUDY PLANS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_plans (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  name               TEXT DEFAULT 'My Study Plan',
  exam_date          DATE,
  hours_per_day      NUMERIC(3,1) DEFAULT 4.0,
  generated_by_ai    BOOLEAN DEFAULT true,
  is_active          BOOLEAN DEFAULT true,
  readiness_score    INTEGER DEFAULT 0,
  total_sessions     INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  ai_summary         TEXT,
  ai_strategy        JSONB,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── STUDY SESSIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_sessions (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id               UUID REFERENCES study_plans(id) ON DELETE CASCADE,
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id            UUID REFERENCES subjects(id),
  topic_id              UUID REFERENCES topics(id),
  scheduled_date        DATE NOT NULL,
  duration_minutes      INTEGER NOT NULL DEFAULT 60,
  session_type          TEXT DEFAULT 'study',
  is_completed          BOOLEAN DEFAULT false,
  notes                 TEXT,
  xp_earned             INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── FLASHCARDS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flashcards (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id    UUID REFERENCES subjects(id),
  topic_id      UUID REFERENCES topics(id),
  front         TEXT NOT NULL,
  back          TEXT NOT NULL,
  hint          TEXT,
  difficulty    TEXT DEFAULT 'medium',
  is_bookmarked BOOLEAN DEFAULT false,
  source        TEXT DEFAULT 'ai_generated',
  ease_factor   NUMERIC(3,2) DEFAULT 2.50,
  interval_days INTEGER DEFAULT 0,
  next_review_date DATE DEFAULT CURRENT_DATE,
  review_count  INTEGER DEFAULT 0,
  last_reviewed TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── NOTES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id),
  topic_id   UUID REFERENCES topics(id),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL DEFAULT '',
  tags       TEXT[] DEFAULT '{}',
  is_pinned  BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── UPLOADED PDFs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploaded_pdfs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  file_name     TEXT NOT NULL,
  file_url      TEXT NOT NULL,
  file_size     BIGINT,
  subject_id    UUID REFERENCES subjects(id),
  is_processed  BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── DOCUMENT CHUNKS (no vector column — add after enabling pgvector) ──
CREATE TABLE IF NOT EXISTS document_chunks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdf_id      UUID REFERENCES uploaded_pdfs(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  chunk_index INTEGER,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── VIVA SESSIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS viva_sessions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id       UUID REFERENCES subjects(id),
  topic_id         UUID REFERENCES topics(id),
  mode             TEXT DEFAULT 'intermediate',
  total_questions  INTEGER DEFAULT 0,
  overall_score    INTEGER DEFAULT 0,
  feedback         TEXT,
  duration_minutes INTEGER,
  xp_earned        INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── CASE STUDIES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS case_studies (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by           UUID REFERENCES users(id),
  title                TEXT NOT NULL,
  chief_complaint      TEXT NOT NULL,
  history              TEXT,
  examination_findings TEXT,
  investigations       TEXT,
  diagnosis            TEXT,
  treatment_plan       TEXT,
  difficulty_level     TEXT DEFAULT 'intermediate',
  subject_id           UUID REFERENCES subjects(id),
  is_ai_generated      BOOLEAN DEFAULT true,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_submissions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  case_id     UUID REFERENCES case_studies(id),
  answers     JSONB,
  score       INTEGER,
  feedback    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── QUESTIONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id      UUID REFERENCES subjects(id),
  topic_id        UUID REFERENCES topics(id),
  question_text   TEXT NOT NULL,
  answer          TEXT,
  question_type   TEXT DEFAULT 'long',
  difficulty      TEXT DEFAULT 'medium',
  frequency_score INTEGER DEFAULT 0,
  year_appeared   INTEGER[] DEFAULT '{}',
  is_predicted    BOOLEAN DEFAULT false,
  tags            TEXT[] DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── PREVIOUS PAPERS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS previous_papers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id    UUID REFERENCES subjects(id),
  year          INTEGER NOT NULL DEFAULT 2024,
  university    TEXT DEFAULT 'RGUHS',
  exam_type     TEXT DEFAULT 'university',
  file_url      TEXT,
  analysis_data JSONB,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── REVISION SCHEDULE ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS revision_schedule (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id          UUID REFERENCES topics(id) ON DELETE CASCADE,
  next_revision_date DATE NOT NULL DEFAULT CURRENT_DATE,
  interval_days     INTEGER DEFAULT 1,
  mastery_level     INTEGER DEFAULT 1,
  ease_factor       NUMERIC(3,2) DEFAULT 2.50,
  is_completed      BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── USER SUBJECT PROGRESS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS user_subject_progress (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id            UUID REFERENCES subjects(id) ON DELETE CASCADE,
  completion_percentage NUMERIC(5,2) DEFAULT 0,
  confidence_level      TEXT DEFAULT 'moderate',
  is_weak               BOOLEAN DEFAULT false,
  last_studied_at       TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, subject_id)
);

-- ── USER TOPIC PROGRESS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_topic_progress (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id        UUID REFERENCES topics(id) ON DELETE CASCADE,
  confidence_level TEXT DEFAULT 'moderate',
  status          TEXT DEFAULT 'not_started',
  last_studied_at TIMESTAMPTZ,
  UNIQUE (user_id, topic_id)
);

-- ── NOTIFICATIONS ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT DEFAULT 'reminder',
  is_read    BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── PERFORMANCE METRICS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS performance_metrics (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  metric_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  study_minutes       INTEGER DEFAULT 0,
  topics_completed    INTEGER DEFAULT 0,
  flashcards_reviewed INTEGER DEFAULT 0,
  viva_sessions       INTEGER DEFAULT 0,
  readiness_score     INTEGER DEFAULT 0,
  xp_earned           INTEGER DEFAULT 0,
  UNIQUE (user_id, metric_date)
);

-- ── STUDY STREAK LOG ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS study_streak_log (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  study_date DATE NOT NULL,
  minutes    INTEGER DEFAULT 0,
  UNIQUE (user_id, study_date)
);

-- ── ACHIEVEMENTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS achievements (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT UNIQUE NOT NULL,
  description     TEXT,
  icon            TEXT,
  xp_reward       INTEGER DEFAULT 100,
  condition_type  TEXT NOT NULL,
  condition_value INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  earned_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

-- ── AUTO updated_at ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── RESILIENT handle_new_user trigger ───────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO users (id, email) VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: users insert failed: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Student'))
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: profiles insert failed: %', SQLERRM;
  END;

  BEGIN
    INSERT INTO user_settings (user_id) VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user: user_settings insert failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards         ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_pdfs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks    ENABLE ROW LEVEL SECURITY;
ALTER TABLE viva_sessions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_submissions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE previous_papers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_schedule  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subject_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics   ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_streak_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects            ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics              ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges            ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own"            ON users              FOR ALL  USING (auth.uid() = id);
CREATE POLICY "profiles_own"         ON profiles           FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "settings_own"         ON user_settings      FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "plans_own"            ON study_plans        FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "sessions_own"         ON study_sessions     FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "flashcards_own"       ON flashcards         FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "notes_own"            ON notes              FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "pdfs_own"             ON uploaded_pdfs      FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "chunks_own"           ON document_chunks    FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "viva_own"             ON viva_sessions      FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "case_sub_own"         ON case_submissions   FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "papers_own"           ON previous_papers    FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "revision_own"         ON revision_schedule  FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "progress_own"         ON user_subject_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "topic_progress_own"   ON user_topic_progress   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notifs_own"           ON notifications      FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "metrics_own"          ON performance_metrics   FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "streak_own"           ON study_streak_log   FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "achievements_own"     ON user_achievements  FOR ALL  USING (auth.uid() = user_id);
CREATE POLICY "case_studies_own"     ON case_studies       FOR ALL  USING (auth.uid() = created_by);

CREATE POLICY "subjects_public"   ON subjects    FOR SELECT USING (true);
CREATE POLICY "topics_public"     ON topics      FOR SELECT USING (true);
CREATE POLICY "colleges_public"   ON colleges    FOR SELECT USING (true);
CREATE POLICY "questions_public"  ON questions   FOR SELECT USING (true);
CREATE POLICY "achievements_read" ON achievements FOR SELECT USING (true);

-- ── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_user       ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_flashcards_user_due ON flashcards(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date  ON study_sessions(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_notifs_unread       ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_revision_due        ON revision_schedule(user_id, next_revision_date) WHERE is_completed = false;
