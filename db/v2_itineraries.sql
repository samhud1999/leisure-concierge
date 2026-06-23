-- V2 itineraries: one row per booking, holds the canonical JSON document
-- the agent mutates and the frontend renders.

CREATE TABLE IF NOT EXISTS itineraries (
  booking_id   text PRIMARY KEY REFERENCES bookings(confirmation_code),
  token        text UNIQUE NOT NULL,
  member_id    bigint NOT NULL REFERENCES members(id),
  doc          jsonb NOT NULL DEFAULT '{}'::jsonb,
  version      int   NOT NULL DEFAULT 1,
  status       text  NOT NULL DEFAULT 'pending',   -- pending | ready | generation_failed
  last_error   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS itineraries_token_idx ON itineraries(token);

-- Pre-issue tokens for every existing booking. Re-runnable: only inserts
-- rows that don't already exist.
INSERT INTO itineraries (booking_id, token, member_id, doc, status)
SELECT b.confirmation_code,
       encode(gen_random_bytes(9), 'base64'),     -- 12-char base64; we
                                                   -- normalise '+/=' →
                                                   -- '-_' in the server
                                                   -- before exposing.
       b.member_id,
       '{}'::jsonb,
       'pending'
FROM bookings b
LEFT JOIN itineraries i ON i.booking_id = b.confirmation_code
WHERE i.booking_id IS NULL;
