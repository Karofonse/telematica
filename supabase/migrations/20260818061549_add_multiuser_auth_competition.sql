/*
# Add multi-user support with per-user progress and competition

## Overview
Transforms the app from single-tenant to multi-user. Three pre-created auth users
(Admin, Andrea, Kei) each get their own isolated progress: XP, streak, sessions,
answers, achievements, and settings. The question bank remains shared.

## Changes
1. Add `profiles` table (display name + role per user)
2. Add `user_id` column to: quiz_sessions, session_answers, app_state, achievements
3. Add `competition_config` table for the competition goal
4. Update RLS policies: per-user ownership via auth.uid()
5. Questions remain shared (all authenticated users can read/write them)

## Security
- RLS enforces per-user ownership on all per-user tables
- Questions remain shared among authenticated users
- Competition config readable by all authenticated, writable by admin only
*/

-- ============================================================
-- profiles table
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT 'Usuario',
  role text NOT NULL DEFAULT 'student',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Add user_id to quiz_sessions
-- ============================================================
ALTER TABLE quiz_sessions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE quiz_sessions ALTER COLUMN user_id SET DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_user ON quiz_sessions(user_id);

DROP POLICY IF EXISTS "anon_select_quiz_sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "anon_insert_quiz_sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "anon_update_quiz_sessions" ON quiz_sessions;
DROP POLICY IF EXISTS "anon_delete_quiz_sessions" ON quiz_sessions;

CREATE POLICY "sessions_select_own" ON quiz_sessions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "sessions_insert_own" ON quiz_sessions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_update_own" ON quiz_sessions
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "sessions_delete_own" ON quiz_sessions
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Add user_id to session_answers
-- ============================================================
ALTER TABLE session_answers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE session_answers ALTER COLUMN user_id SET DEFAULT auth.uid();
CREATE INDEX IF NOT EXISTS idx_session_answers_user ON session_answers(user_id);

DROP POLICY IF EXISTS "anon_select_session_answers" ON session_answers;
DROP POLICY IF EXISTS "anon_insert_session_answers" ON session_answers;
DROP POLICY IF EXISTS "anon_update_session_answers" ON session_answers;
DROP POLICY IF EXISTS "anon_delete_session_answers" ON session_answers;

CREATE POLICY "answers_select_own" ON session_answers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "answers_insert_own" ON session_answers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "answers_update_own" ON session_answers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "answers_delete_own" ON session_answers
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Add user_id to app_state (now per-user)
-- ============================================================
ALTER TABLE app_state ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE app_state ALTER COLUMN user_id SET DEFAULT auth.uid();
ALTER TABLE app_state ALTER COLUMN id DROP DEFAULT;
CREATE UNIQUE INDEX IF NOT EXISTS app_state_user_id_idx ON app_state(user_id);
CREATE INDEX IF NOT EXISTS idx_app_state_user ON app_state(user_id);

DROP POLICY IF EXISTS "anon_select_app_state" ON app_state;
DROP POLICY IF EXISTS "anon_insert_app_state" ON app_state;
DROP POLICY IF EXISTS "anon_update_app_state" ON app_state;
DROP POLICY IF EXISTS "anon_delete_app_state" ON app_state;

CREATE POLICY "state_select_own" ON app_state
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "state_insert_own" ON app_state
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "state_update_own" ON app_state
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "state_delete_own" ON app_state
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Add user_id to achievements (now per-user)
-- ============================================================
ALTER TABLE achievements ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE achievements ALTER COLUMN user_id SET DEFAULT auth.uid();

-- Drop the old unique constraint on key, replace with per-user unique
ALTER TABLE achievements DROP CONSTRAINT IF EXISTS achievements_key_key;
CREATE UNIQUE INDEX IF NOT EXISTS achievements_user_key_idx ON achievements(user_id, key);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);

DROP POLICY IF EXISTS "anon_select_achievements" ON achievements;
DROP POLICY IF EXISTS "anon_insert_achievements" ON achievements;
DROP POLICY IF EXISTS "anon_delete_achievements" ON achievements;

CREATE POLICY "ach_select_own" ON achievements
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ach_insert_own" ON achievements
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ach_delete_own" ON achievements
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Update questions RLS: authenticated only (shared bank)
-- ============================================================
DROP POLICY IF EXISTS "anon_select_questions" ON questions;
DROP POLICY IF EXISTS "anon_insert_questions" ON questions;
DROP POLICY IF EXISTS "anon_update_questions" ON questions;
DROP POLICY IF EXISTS "anon_delete_questions" ON questions;

CREATE POLICY "questions_select_auth" ON questions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "questions_insert_auth" ON questions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "questions_update_auth" ON questions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "questions_delete_auth" ON questions
  FOR DELETE TO authenticated USING (true);

-- ============================================================
-- competition_config table
-- ============================================================
CREATE TABLE IF NOT EXISTS competition_config (
  id int PRIMARY KEY DEFAULT 1,
  goal_mastered int NOT NULL DEFAULT 50,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE competition_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comp_select" ON competition_config;
CREATE POLICY "comp_select" ON competition_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "comp_update" ON competition_config;
CREATE POLICY "comp_update" ON competition_config
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'));

DROP POLICY IF EXISTS "comp_insert" ON competition_config;
CREATE POLICY "comp_insert" ON competition_config
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'));

INSERT INTO competition_config (id, goal_mastered) VALUES (1, 50)
  ON CONFLICT (id) DO NOTHING;