/*
# Study Quest — Gamified Study App Schema (single-tenant, no auth)

## Overview
Creates the complete database for a gamified study/quiz application (Kahoot/Anki/Duolingo inspired).
Single-tenant: no user accounts, no auth. The anon-key frontend reads/writes directly.

## New Tables
1. `questions` — the question bank. Each row is one study question with 4 options,
   a correct answer, explanation, topic/subtopic, difficulty, and spaced-repetition
   tracking fields (mastery, correct/total counts, next review date, interval).
2. `quiz_sessions` — one row per completed quiz attempt (score, xp earned, timing).
3. `session_answers` — one row per answer given during a quiz session (for history,
   per-day stats, per-topic stats, weakness detection).
4. `app_state` — single-row table holding global gamification state: XP, level, streak,
   best streak, last study date, and a JSONB settings blob (sounds, animations, timer, etc.).
5. `achievements` — unlocked achievements (key + unlocked_at).

## Security
- RLS enabled on every table.
- All tables allow full CRUD for `anon, authenticated` (single-tenant, no auth, data is
  intentionally shared — documented here).
*/

-- ============================================================
-- questions
-- ============================================================
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  qid text NOT NULL,                          -- human label like Q001
  topic text NOT NULL DEFAULT 'General',
  subtopic text DEFAULT '',
  question text NOT NULL,
  options text[] NOT NULL DEFAULT '{}',       -- exactly 4 entries
  correct_index int NOT NULL DEFAULT 0,        -- 0..3
  explanation text DEFAULT '',
  difficulty text DEFAULT 'medium',            -- easy | medium | hard
  created_at timestamptz NOT NULL DEFAULT now(),

  -- spaced repetition / mastery tracking
  correct_count int NOT NULL DEFAULT 0,
  total_count int NOT NULL DEFAULT 0,
  consecutive_correct int NOT NULL DEFAULT 0,
  last_answered_at timestamptz,
  next_review_at timestamptz DEFAULT now(),
  interval_days double precision NOT NULL DEFAULT 1
);

ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_questions" ON questions;
CREATE POLICY "anon_select_questions" ON questions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_questions" ON questions;
CREATE POLICY "anon_insert_questions" ON questions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_questions" ON questions;
CREATE POLICY "anon_update_questions" ON questions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_questions" ON questions;
CREATE POLICY "anon_delete_questions" ON questions FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- quiz_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  total int NOT NULL DEFAULT 0,
  correct int NOT NULL DEFAULT 0,
  xp_earned int NOT NULL DEFAULT 0,
  mode text NOT NULL DEFAULT 'smart',          -- smart | errors | topic | all
  topic text DEFAULT ''
);

ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_quiz_sessions" ON quiz_sessions;
CREATE POLICY "anon_select_quiz_sessions" ON quiz_sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_quiz_sessions" ON quiz_sessions;
CREATE POLICY "anon_insert_quiz_sessions" ON quiz_sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_quiz_sessions" ON quiz_sessions;
CREATE POLICY "anon_update_quiz_sessions" ON quiz_sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_quiz_sessions" ON quiz_sessions;
CREATE POLICY "anon_delete_quiz_sessions" ON quiz_sessions FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- session_answers
-- ============================================================
CREATE TABLE IF NOT EXISTS session_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  selected_index int,                          -- null = timed out
  is_correct boolean NOT NULL DEFAULT false,
  timed_out boolean NOT NULL DEFAULT false,
  time_taken_ms int DEFAULT 0,
  answered_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_session_answers" ON session_answers;
CREATE POLICY "anon_select_session_answers" ON session_answers FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_session_answers" ON session_answers;
CREATE POLICY "anon_insert_session_answers" ON session_answers FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_session_answers" ON session_answers;
CREATE POLICY "anon_update_session_answers" ON session_answers FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_session_answers" ON session_answers;
CREATE POLICY "anon_delete_session_answers" ON session_answers FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- app_state  (single row, id = 1)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_state (
  id int PRIMARY KEY DEFAULT 1,
  xp int NOT NULL DEFAULT 0,
  level int NOT NULL DEFAULT 1,
  streak int NOT NULL DEFAULT 0,
  best_streak int NOT NULL DEFAULT 0,
  last_study_date date,
  settings jsonb NOT NULL DEFAULT '{"sounds": true, "animations": true, "timerEnabled": true, "timerSeconds": 20, "defaultQuestionCount": 10, "repetitionIntensity": "normal", "theme": "dark"}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_app_state" ON app_state;
CREATE POLICY "anon_select_app_state" ON app_state FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_app_state" ON app_state;
CREATE POLICY "anon_insert_app_state" ON app_state FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_app_state" ON app_state;
CREATE POLICY "anon_update_app_state" ON app_state FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_app_state" ON app_state;
CREATE POLICY "anon_delete_app_state" ON app_state FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- achievements
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  unlocked_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_achievements" ON achievements;
CREATE POLICY "anon_select_achievements" ON achievements FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_achievements" ON achievements;
CREATE POLICY "anon_insert_achievements" ON achievements FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_achievements" ON achievements;
CREATE POLICY "anon_delete_achievements" ON achievements FOR DELETE
  TO anon, authenticated USING (true);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_next_review ON questions(next_review_at);
CREATE INDEX IF NOT EXISTS idx_session_answers_question ON session_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_session_answers_answered_at ON session_answers(answered_at);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_completed ON quiz_sessions(completed_at);

-- ============================================================
-- Seed app_state single row
-- ============================================================
INSERT INTO app_state (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;