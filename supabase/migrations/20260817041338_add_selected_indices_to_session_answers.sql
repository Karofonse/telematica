/*
# Add selected_indices to session_answers

## Overview
Adds a `selected_indices` array column to `session_answers` so we can store multiple
selected answers per question (for multiple-response questions).

## Changes
- `session_answers.selected_indices` (int[], nullable) — array of selected option indices
*/

ALTER TABLE session_answers
  ADD COLUMN IF NOT EXISTS selected_indices int[];