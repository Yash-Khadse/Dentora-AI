-- Grant table permissions to authenticated and anon roles
-- RLS policies filter rows; GRANTs allow the role to touch the table at all.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON
  users,
  profiles,
  user_settings,
  study_plans,
  study_sessions,
  flashcards,
  notes,
  uploaded_pdfs,
  document_chunks,
  viva_sessions,
  case_studies,
  case_submissions,
  questions,
  previous_papers,
  revision_schedule,
  user_subject_progress,
  user_topic_progress,
  notifications,
  performance_metrics,
  study_streak_log,
  user_achievements
TO authenticated;

-- Public content (read-only for everyone)
GRANT SELECT ON subjects, topics, colleges, achievements TO anon, authenticated;

-- Allow sequences (needed for uuid_generate_v4 via DEFAULT)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Future tables should inherit grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
