/*
# Add image support and flexible option count to questions

## Overview
Adds image URL columns to questions so both the question itself and each option
can optionally have an image. Also supports up to 6 options (currently 4).

## Changes
- `questions.question_image` (text, nullable) — optional image URL for the question
- `questions.option_images` (text[], default empty) — optional image URLs per option,
  parallel to the `options` text array. Empty string entry = no image for that option.
*/

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS question_image text DEFAULT '';

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS option_images text[] DEFAULT '{}';

-- Backfill existing rows with empty images so arrays match options length
UPDATE questions
  SET option_images = ARRAY(SELECT '' FROM generate_series(1, array_length(options, 1)))
  WHERE option_images = '{}' OR option_images IS NULL;