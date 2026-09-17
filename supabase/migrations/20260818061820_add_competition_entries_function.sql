/*
# Add get_competition_entries SECURITY DEFINER function

## Overview
Creates a SECURITY DEFINER function that returns competition data for all users.
This is needed because RLS only lets users see their own app_state/profiles,
but the competition screen needs to show everyone's progress.

## Security
- SECURITY DEFINER: runs with the function owner's privileges (postgres), bypassing RLS
- EXECUTE granted to authenticated only (not anon)
- Returns only the columns needed for the competition leaderboard
- Read-only: no mutations
*/

CREATE OR REPLACE FUNCTION get_competition_entries()
RETURNS TABLE (
  user_id uuid,
  display_name text,
  role text,
  xp int,
  level int,
  streak int,
  mastered_count bigint,
  total_answered bigint,
  accuracy int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.user_id,
    p.display_name,
    p.role,
    COALESCE(a.xp, 0) AS xp,
    COALESCE(a.level, 1) AS level,
    COALESCE(a.streak, 0) AS streak,
    (
      SELECT count(*)::bigint FROM questions q
      WHERE q.consecutive_correct >= 3
    ) AS mastered_count,
    (
      SELECT count(*)::bigint FROM session_answers sa
      WHERE sa.user_id = p.user_id
    ) AS total_answered,
    COALESCE((
      SELECT CASE WHEN count(*) > 0
        THEN round(avg(CASE WHEN is_correct THEN 100 ELSE 0 END))::int
        ELSE 0 END
      FROM session_answers sa
      WHERE sa.user_id = p.user_id
    ), 0) AS accuracy
  FROM profiles p
  LEFT JOIN app_state a ON a.user_id = p.user_id
  ORDER BY xp DESC;
$$;

GRANT EXECUTE ON FUNCTION get_competition_entries() TO authenticated;