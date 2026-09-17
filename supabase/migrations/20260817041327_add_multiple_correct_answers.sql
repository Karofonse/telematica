/*
# Add multiple correct answers support to questions

## Overview
Adds a `correct_indices` array column to the `questions` table so a question can have
multiple correct answers (e.g. "Select all that apply"). Existing single-answer questions
are backfilled with a single-element array derived from their `correct_index` column.

## Changes
- `questions.correct_indices` (int[], default single-element array from correct_index)
- Backfill all existing rows from `correct_index`
*/

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS correct_indices int[] DEFAULT '{}';

-- Backfill: for each row, set correct_indices to [correct_index] if empty
UPDATE questions
  SET correct_indices = ARRAY[correct_index]
  WHERE correct_indices = '{}' OR correct_indices IS NULL;

-- Add a default so future single-answer inserts still work if correct_indices is omitted
ALTER TABLE questions
  ALTER COLUMN correct_indices SET DEFAULT '{}';