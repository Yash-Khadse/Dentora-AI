-- ============================================================
-- DENTORA AI - Complete Database Schema
-- Supabase PostgreSQL with pgvector
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- for full-text search

-- ============================================================
-- COLLEGES
-- ============================================================
CREATE TABLE colleges (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  code          TEXT UNIQUE NOT NULL,  -- e.g. "MIDS"
  university    TEXT NOT NULL DEFAULT 'RGUHS',
  city          TEXT,
  state         TEXT DEFAULT 'Karnataka',
  country       TEXT DEFAULT 'India',
  logo_url      TEXT,
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Meghna Institute
INSERT INTO colleges (name, code, university, city, state)
VALUES ('Meghna Institute of Dental Sciences', 'MIDS', 'RGUHS', 'Nizamabad', 'Telangana');

-- ============================================================
-- USERS (extends Supabase auth.users)
-- ============================================================
CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT UNIQUE NOT NULL,
  role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'faculty')),
  college_id    UUID REFERENCES colleges(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  full_name              TEXT NOT NULL,
  avatar_url             TEXT,
  batch_year             INTEGER,
  roll_number            TEXT,
  phone                  TEXT,
  -- Exam info
  exam_date              DATE,
  target_percentage      INTEGER DEFAULT 75 CHECK (target_percentage BETWEEN 0 AND 100),
  -- Study preferences
  learning_style         TEXT DEFAULT 'visual' CHECK (learning_style IN ('visual','auditory','reading','kinesthetic')),
  daily_study_hours      NUMERIC(3,1) DEFAULT 4.0,
  wake_time              TIME DEFAULT '06:00',
  sleep_time             TIME DEFAULT '23:00',
  college_start_time     TIME DEFAULT '09:00',
  college_end_time       TIME DEFAULT '17:00',
  weekly_holidays        TEXT[] DEFAULT ARRAY['sunday'],
  preferred_session_mins INTEGER DEFAULT 45,
  revision_frequency     INTEGER DEFAULT 7, -- days between revisions
  -- Gamification
  xp_points              INTEGER DEFAULT 0,
  study_streak           INTEGER DEFAULT 0,
  longest_streak         INTEGER DEFAULT 0,
  last_active_date       DATE,
  -- Status
  onboarding_completed   BOOLEAN DEFAULT false,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUBJECTS
-- ============================================================
CREATE TABLE subjects (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id       UUID REFERENCES colleges(id),
  name             TEXT NOT NULL,
  code             TEXT NOT NULL,
  description      TEXT,
  total_topics     INTEGER DEFAULT 0,
  exam_weightage   INTEGER DEFAULT 15, -- percentage
  color            TEXT DEFAULT '#3b82f6',
  icon             TEXT,
  order_index      INTEGER DEFAULT 0,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (college_id, code)
);

-- ============================================================
-- TOPICS
-- ============================================================
CREATE TABLE topics (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id       UUID REFERENCES subjects(id) ON DELETE CASCADE,
  parent_topic_id  UUID REFERENCES topics(id),
  name             TEXT NOT NULL,
  description      TEXT,
  difficulty       TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  estimated_hours  NUMERIC(3,1) DEFAULT 2.0,
  is_important     BOOLEAN DEFAULT false,
  order_index      INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER SUBJECT PROGRESS
-- ============================================================
CREATE TABLE user_subject_progress (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id           UUID REFERENCES subjects(id) ON DELETE CASCADE,
  completion_pct       NUMERIC(5,2) DEFAULT 0,
  confidence_score     INTEGER DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 100),
  revision_status      TEXT DEFAULT 'not_started'
                       CHECK (revision_status IN ('not_started','in_progress','revised','mastered')),
  study_hours_spent    NUMERIC(6,2) DEFAULT 0,
  is_weak              BOOLEAN DEFAULT false,
  is_strong            BOOLEAN DEFAULT false,
  last_studied_at      TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, subject_id)
);

-- ============================================================
-- USER TOPIC PROGRESS
-- ============================================================
CREATE TABLE user_topic_progress (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id         UUID REFERENCES topics(id) ON DELETE CASCADE,
  status           TEXT DEFAULT 'not_started'
                   CHECK (status IN ('not_started','in_progress','completed')),
  confidence       INTEGER DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100),
  study_minutes    INTEGER DEFAULT 0,
  last_studied_at  TIMESTAMPTZ,
  notes            TEXT,
  UNIQUE (user_id, topic_id)
);

-- ============================================================
-- STUDY PLANS
-- ============================================================
CREATE TABLE study_plans (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID REFERENCES users(id) ON DELETE CASCADE,
  name               TEXT NOT NULL DEFAULT 'My Study Plan',
  exam_date          DATE NOT NULL,
  generated_by_ai    BOOLEAN DEFAULT true,
  is_active          BOOLEAN DEFAULT true,
  readiness_score    INTEGER DEFAULT 0,
  total_sessions     INTEGER DEFAULT 0,
  completed_sessions INTEGER DEFAULT 0,
  ai_summary         TEXT,   -- AI-generated plan summary
  ai_strategy        JSONB,  -- full AI plan JSON
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STUDY SESSIONS
-- ============================================================
CREATE TABLE study_sessions (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plan_id                 UUID REFERENCES study_plans(id) ON DELETE CASCADE,
  user_id                 UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id              UUID REFERENCES subjects(id),
  topic_id                UUID REFERENCES topics(id),
  session_date            DATE NOT NULL,
  start_time              TIME NOT NULL,
  end_time                TIME NOT NULL,
  planned_duration_mins   INTEGER NOT NULL,
  actual_duration_mins    INTEGER,
  session_type            TEXT DEFAULT 'study'
                          CHECK (session_type IN ('study','revision','practice','viva','break')),
  status                  TEXT DEFAULT 'scheduled'
                          CHECK (status IN ('scheduled','completed','missed','skipped','rescheduled')),
  notes                   TEXT,
  xp_earned               INTEGER DEFAULT 0,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- REVISION SCHEDULE (Spaced Repetition)
-- ============================================================
CREATE TABLE revision_schedule (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  topic_id       UUID REFERENCES topics(id) ON DELETE CASCADE,
  due_date       DATE NOT NULL,
  interval_days  INTEGER DEFAULT 1,
  repetition_no  INTEGER DEFAULT 1,  -- which repetition (1st, 2nd, 3rd...)
  ease_factor    NUMERIC(3,2) DEFAULT 2.50,
  is_completed   BOOLEAN DEFAULT false,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTES
-- ============================================================
CREATE TABLE notes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id  UUID REFERENCES subjects(id),
  topic_id    UUID REFERENCES topics(id),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',  -- markdown
  tags        TEXT[] DEFAULT '{}',
  is_pinned   BOOLEAN DEFAULT false,
  word_count  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UPLOADED PDFs
-- ============================================================
CREATE TABLE uploaded_pdfs (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES users(id) ON DELETE CASCADE,
  filename          TEXT NOT NULL,
  original_name     TEXT NOT NULL,
  file_url          TEXT NOT NULL,
  file_size_bytes   BIGINT,
  subject_id        UUID REFERENCES subjects(id),
  pdf_type          TEXT DEFAULT 'notes'
                    CHECK (pdf_type IN ('notes','paper','textbook','other')),
  processed         BOOLEAN DEFAULT false,
  page_count        INTEGER,
  extracted_text    TEXT,
  embedding_status  TEXT DEFAULT 'pending'
                    CHECK (embedding_status IN ('pending','processing','done','failed')),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DOCUMENT CHUNKS (for RAG / pgvector)
-- ============================================================
CREATE TABLE document_chunks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pdf_id      UUID REFERENCES uploaded_pdfs(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  chunk_index INTEGER,
  embedding   vector(768),  -- text-embedding-004 dimension
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- FLASHCARDS
-- ============================================================
CREATE TABLE flashcards (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id      UUID REFERENCES subjects(id),
  topic_id        UUID REFERENCES topics(id),
  front           TEXT NOT NULL,
  back            TEXT NOT NULL,
  hint            TEXT,
  difficulty      TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  is_bookmarked   BOOLEAN DEFAULT false,
  source          TEXT DEFAULT 'manual' CHECK (source IN ('manual','ai_generated','pdf_extracted')),
  tags            TEXT[] DEFAULT '{}',
  -- SM-2 spaced repetition
  ease_factor     NUMERIC(3,2) DEFAULT 2.50,
  interval_days   INTEGER DEFAULT 0,
  due_date        DATE DEFAULT CURRENT_DATE,
  review_count    INTEGER DEFAULT 0,
  last_reviewed   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PREVIOUS YEAR PAPERS
-- ============================================================
CREATE TABLE previous_papers (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  title                TEXT NOT NULL,
  year                 INTEGER NOT NULL,
  subject_id           UUID REFERENCES subjects(id),
  file_url             TEXT,
  extracted_questions  INTEGER DEFAULT 0,
  processed            BOOLEAN DEFAULT false,
  analysis_json        JSONB,  -- full paper analysis
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- QUESTIONS (Question Bank)
-- ============================================================
CREATE TABLE questions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id       UUID REFERENCES subjects(id),
  topic_id         UUID REFERENCES topics(id),
  question_text    TEXT NOT NULL,
  answer           TEXT,
  question_type    TEXT DEFAULT 'long'
                   CHECK (question_type IN ('long','short','viva','mcq','case')),
  difficulty       TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  marks            INTEGER,
  year_appeared    INTEGER[] DEFAULT '{}',
  frequency_count  INTEGER DEFAULT 1,
  importance_score INTEGER DEFAULT 50 CHECK (importance_score BETWEEN 0 AND 100),
  probability_score INTEGER DEFAULT 50 CHECK (probability_score BETWEEN 0 AND 100),
  priority         TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  source_paper_id  UUID REFERENCES previous_papers(id),
  is_predicted     BOOLEAN DEFAULT false,
  tags             TEXT[] DEFAULT '{}',
  embedding        vector(768),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX ON questions USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- QUESTION FREQUENCY ANALYSIS
-- ============================================================
CREATE TABLE question_frequency (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id     UUID REFERENCES questions(id) ON DELETE CASCADE,
  subject_id      UUID REFERENCES subjects(id),
  topic_tag       TEXT,
  total_count     INTEGER DEFAULT 1,
  years           INTEGER[] DEFAULT '{}',
  last_appeared   INTEGER,
  trend           TEXT DEFAULT 'stable' CHECK (trend IN ('rising','stable','declining')),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIVA SESSIONS
-- ============================================================
CREATE TABLE viva_sessions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id          UUID REFERENCES subjects(id),
  topic_id            UUID REFERENCES topics(id),
  mode                TEXT DEFAULT 'intermediate'
                      CHECK (mode IN ('beginner','intermediate','exam','mock_external')),
  total_questions     INTEGER DEFAULT 0,
  correct_answers     INTEGER DEFAULT 0,
  accuracy_score      INTEGER DEFAULT 0,
  completeness_score  INTEGER DEFAULT 0,
  confidence_score    INTEGER DEFAULT 0,
  terminology_score   INTEGER DEFAULT 0,
  overall_score       INTEGER DEFAULT 0,
  feedback            TEXT,
  duration_minutes    INTEGER,
  xp_earned           INTEGER DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VIVA QUESTIONS (per session)
-- ============================================================
CREATE TABLE viva_questions (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id           UUID REFERENCES viva_sessions(id) ON DELETE CASCADE,
  question_text        TEXT NOT NULL,
  user_answer          TEXT,
  ai_ideal_answer      TEXT,
  score                INTEGER DEFAULT 0,
  feedback             TEXT,
  follow_up_questions  TEXT[] DEFAULT '{}',
  question_order       INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CASE STUDIES
-- ============================================================
CREATE TABLE case_studies (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by              UUID REFERENCES users(id),
  title                   TEXT NOT NULL,
  chief_complaint         TEXT NOT NULL,
  history                 TEXT,
  examination_findings    TEXT,
  investigation_results   TEXT,
  diagnosis               TEXT,
  treatment_plan          TEXT,
  difficulty              TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  subject_id              UUID REFERENCES subjects(id),
  tags                    TEXT[] DEFAULT '{}',
  is_ai_generated         BOOLEAN DEFAULT false,
  is_public               BOOLEAN DEFAULT true,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CASE SUBMISSIONS (student attempts)
-- ============================================================
CREATE TABLE case_submissions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID REFERENCES users(id) ON DELETE CASCADE,
  case_id                UUID REFERENCES case_studies(id),
  submitted_diagnosis    TEXT,
  submitted_treatment    TEXT,
  submitted_reasoning    TEXT,
  ai_score               INTEGER,
  ai_feedback            TEXT,
  ai_evaluation          JSONB,
  created_at             TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXAM PREDICTIONS
-- ============================================================
CREATE TABLE exam_predictions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES users(id),
  subject_id        UUID REFERENCES subjects(id),
  prediction_json   JSONB NOT NULL,
  generated_at      TIMESTAMPTZ DEFAULT NOW(),
  valid_until       TIMESTAMPTZ,
  is_active         BOOLEAN DEFAULT true
);

-- ============================================================
-- PERFORMANCE METRICS (daily log)
-- ============================================================
CREATE TABLE performance_metrics (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  metric_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  study_minutes        INTEGER DEFAULT 0,
  topics_completed     INTEGER DEFAULT 0,
  flashcards_reviewed  INTEGER DEFAULT 0,
  viva_sessions        INTEGER DEFAULT 0,
  readiness_score      INTEGER DEFAULT 0,
  readiness_delta      INTEGER DEFAULT 0,
  xp_earned            INTEGER DEFAULT 0,
  UNIQUE (user_id, metric_date)
);

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================
CREATE TABLE achievements (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT UNIQUE NOT NULL,
  description      TEXT,
  icon             TEXT,
  xp_reward        INTEGER DEFAULT 100,
  condition_type   TEXT NOT NULL,  -- 'streak', 'xp', 'topics', 'sessions', etc.
  condition_value  INTEGER NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_achievements (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id),
  earned_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, achievement_id)
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT DEFAULT 'reminder'
              CHECK (type IN ('reminder','achievement','plan_update','streak','ai_insight','exam_alert')),
  is_read     BOOLEAN DEFAULT false,
  action_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USER SETTINGS
-- ============================================================
CREATE TABLE user_settings (
  id                         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                    UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  -- Notifications
  notify_daily_reminder      BOOLEAN DEFAULT true,
  notify_revision_due        BOOLEAN DEFAULT true,
  notify_streak_alert        BOOLEAN DEFAULT true,
  notify_achievements        BOOLEAN DEFAULT true,
  reminder_time              TIME DEFAULT '08:00',
  -- AI
  ai_provider                TEXT DEFAULT 'gemini',
  ai_verbosity               TEXT DEFAULT 'balanced' CHECK (ai_verbosity IN ('concise','balanced','detailed')),
  -- Display
  theme                      TEXT DEFAULT 'system' CHECK (theme IN ('light','dark','system')),
  language                   TEXT DEFAULT 'en',
  -- Privacy
  show_on_leaderboard        BOOLEAN DEFAULT true,
  share_progress             BOOLEAN DEFAULT false,
  created_at                 TIMESTAMPTZ DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STUDY STREAKS (detailed tracking)
-- ============================================================
CREATE TABLE study_streak_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  study_date  DATE NOT NULL,
  minutes     INTEGER NOT NULL DEFAULT 0,
  UNIQUE (user_id, study_date)
);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_study_plans_updated BEFORE UPDATE ON study_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_settings_updated BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile/settings on user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email) VALUES (NEW.id, NEW.email);
  INSERT INTO profiles (user_id, full_name)
    VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New Student'));
  INSERT INTO user_settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Similarity search function for RAG
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  similarity FLOAT,
  pdf_id UUID,
  metadata JSONB
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    1 - (dc.embedding <=> query_embedding) AS similarity,
    dc.pdf_id,
    dc.metadata
  FROM document_chunks dc
  WHERE
    (filter_user_id IS NULL OR dc.user_id = filter_user_id)
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subject_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_pdfs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE previous_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE viva_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE viva_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_streak_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_predictions ENABLE ROW LEVEL SECURITY;

-- Users can only see/modify their own data
CREATE POLICY "users_own_data" ON users FOR ALL USING (auth.uid() = id);
CREATE POLICY "profiles_own_data" ON profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "progress_own_data" ON user_subject_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "topic_progress_own" ON user_topic_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "plans_own_data" ON study_plans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "sessions_own_data" ON study_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "revision_own_data" ON revision_schedule FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notes_own_data" ON notes FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "pdfs_own_data" ON uploaded_pdfs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "chunks_own_data" ON document_chunks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "flashcards_own_data" ON flashcards FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "papers_own_data" ON previous_papers FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "viva_own_data" ON viva_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "viva_q_own_data" ON viva_questions FOR ALL
  USING (session_id IN (SELECT id FROM viva_sessions WHERE user_id = auth.uid()));
CREATE POLICY "case_sub_own_data" ON case_submissions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "metrics_own_data" ON performance_metrics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "achievements_own_data" ON user_achievements FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "notifications_own_data" ON notifications FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "settings_own_data" ON user_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "streak_own_data" ON study_streak_log FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "predictions_own_data" ON exam_predictions FOR ALL USING (auth.uid() = user_id);

-- Public read for colleges, subjects, topics, questions (shared content)
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "colleges_public_read" ON colleges FOR SELECT USING (true);
CREATE POLICY "subjects_public_read" ON subjects FOR SELECT USING (true);
CREATE POLICY "topics_public_read" ON topics FOR SELECT USING (true);
CREATE POLICY "questions_public_read" ON questions FOR SELECT USING (true);
CREATE POLICY "cases_public_read" ON case_studies FOR SELECT USING (is_public = true);
CREATE POLICY "achievements_public_read" ON achievements FOR SELECT USING (true);

-- ============================================================
-- PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_sessions_user_date ON study_sessions(user_id, session_date);
CREATE INDEX idx_sessions_plan ON study_sessions(plan_id);
CREATE INDEX idx_flashcards_user_due ON flashcards(user_id, due_date);
CREATE INDEX idx_flashcards_subject ON flashcards(subject_id);
CREATE INDEX idx_questions_subject ON questions(subject_id);
CREATE INDEX idx_questions_frequency ON questions(frequency_count DESC);
CREATE INDEX idx_questions_probability ON questions(probability_score DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_revision_user_due ON revision_schedule(user_id, due_date) WHERE is_completed = false;
CREATE INDEX idx_metrics_user_date ON performance_metrics(user_id, metric_date DESC);
CREATE INDEX idx_viva_user ON viva_sessions(user_id, created_at DESC);
CREATE INDEX idx_notes_user ON notes(user_id, updated_at DESC);
CREATE INDEX idx_chunks_pdf ON document_chunks(pdf_id);

-- Full-text search on questions
CREATE INDEX idx_questions_fts ON questions USING gin(to_tsvector('english', question_text));
CREATE INDEX idx_notes_fts ON notes USING gin(to_tsvector('english', title || ' ' || content));
