-- ============================================================
-- Fix case_studies: add model_answer column + user-owned RLS
-- ============================================================

-- Add model_answer JSONB column (safe to re-run)
ALTER TABLE case_studies ADD COLUMN IF NOT EXISTS model_answer JSONB;

-- Allow students to insert their own AI-generated cases
CREATE POLICY "cases_own_insert" ON case_studies
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Students can read public cases OR their own cases
DROP POLICY IF EXISTS "cases_public_read" ON case_studies;
CREATE POLICY "cases_read" ON case_studies
  FOR SELECT USING (is_public = true OR auth.uid() = created_by);

-- Students can update/delete only their own cases
CREATE POLICY "cases_own_update" ON case_studies
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "cases_own_delete" ON case_studies
  FOR DELETE USING (auth.uid() = created_by);
