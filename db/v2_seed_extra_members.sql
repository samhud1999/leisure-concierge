-- ============================================================================
-- V2 extra demo members + bookings + pre-issued itinerary tokens
--
-- Adds 7 demo members (member numbers 100301..100307), one upcoming booking
-- each across 7 different RACV resorts, and a pre-issued itinerary token per
-- booking so each member has a shareable deep link.
--
-- Re-runnable: the three INSERTs use ON CONFLICT DO NOTHING, so running this
-- file a second time is a no-op.
--
-- Token notes:
--   - Stored token is standard base64 (gen_random_bytes(9), 12 chars).
--   - The /api/login + /i/<token> routes normalise to URL-safe base64 server-
--     side (toUrlSafe / fromUrlSafe in server/tools/tokens.js). The final
--     SELECT at the bottom of this file shows the URL-safe form ready to
--     paste into a /i/<token> deep link.
--
-- Weather caveat (today 2026-06-23):
--   - Open-Meteo's forecast horizon is ~16 days. Bookings after ~9 Jul 2026
--     will be generated with seasonal judgement, not live forecast. This is
--     handled gracefully by the generator; the per-day weather block falls
--     back to null fields.
-- ============================================================================

-- 1) Members ------------------------------------------------------------------
INSERT INTO members (member_number, surname, first_name, email, preferences)
VALUES
  ('100301', 'Kaplan',   'Andre',   null, '{"interests":["food","wine"],"pace":"relaxed"}'::jsonb),
  ('100302', 'Sokolov',  'Natasha', null, '{"interests":["wine","spa"],"pace":"relaxed"}'::jsonb),
  ('100303', 'Patel',    'Craig',   null, '{"interests":["beach","family"],"pace":"balanced"}'::jsonb),
  ('100304', 'Mitchell', 'Gavin',   null, '{"interests":["golf","fine dining"],"pace":"active"}'::jsonb),
  ('100305', 'Park',     'Chris',   null, '{"interests":["sports","nightlife"],"pace":"active"}'::jsonb),
  ('100306', 'Liu',      'Jenny',   null, '{"interests":["history","nature"],"pace":"balanced"}'::jsonb),
  ('100307', 'Stone',    'Bethany', null, '{"interests":["beach","spa"],"pace":"relaxed"}'::jsonb)
ON CONFLICT (member_number) DO NOTHING;

-- 2) Bookings -----------------------------------------------------------------
INSERT INTO bookings (
  member_id, resort_id, confirmation_code,
  check_in, check_out, room_type, party_size, party_composition, add_ons
)
SELECT m.id, r.id, b.code,
       b.check_in::date, b.check_out::date,
       b.room_type, b.party_size, b.party_composition, b.add_ons
FROM (VALUES
  ('100301', 'cape-schanck',           'RACV-CS-3101', '2026-07-07', '2026-07-09', 'Spa Suite',             2, 'couple',  ARRAY['One Spa package','Sparkling on arrival']),
  ('100302', 'healesville',            'RACV-HV-3102', '2026-07-10', '2026-07-13', 'Vineyard Room',         2, 'couple',  ARRAY['Yarra Valley wine flight','Cheese plate']),
  ('100303', 'inverloch',              'RACV-IV-3103', '2026-07-18', '2026-07-22', 'Family Villa',          4, 'family',  ARRAY['Bike hire (4)','Beach pack']),
  ('100304', 'noosa',                  'RACV-NS-3104', '2026-07-25', '2026-07-30', 'Beachfront Apartment',  2, 'couple',  ARRAY['Sunset cruise','Round of golf']),
  ('100305', 'royal-pines-gold-coast', 'RACV-RP-3105', '2026-08-03', '2026-08-05', 'Twin Studio',           2, 'friends', ARRAY['Theme park 2-day pass']),
  ('100306', 'goldfields',             'RACV-GF-3106', '2026-08-07', '2026-08-10', 'Family Lodge',          3, 'family',  ARRAY['Sovereign Hill family pass']),
  ('100307', 'torquay',                'RACV-TQ-3107', '2026-08-15', '2026-08-18', 'Family Room',           4, 'family',  ARRAY['One Spa kids package','Surf lesson voucher'])
) AS b(member_number, resort_slug, code, check_in, check_out, room_type, party_size, party_composition, add_ons)
JOIN members m ON m.member_number = b.member_number
JOIN resorts  r ON r.slug          = b.resort_slug
ON CONFLICT (confirmation_code) DO NOTHING;

-- 3) Pre-issue itinerary tokens for the new bookings -------------------------
INSERT INTO itineraries (booking_id, token, member_id, doc, status)
SELECT b.confirmation_code,
       encode(gen_random_bytes(9), 'base64'),
       b.member_id,
       '{}'::jsonb,
       'pending'
FROM bookings b
WHERE b.confirmation_code IN (
  'RACV-CS-3101','RACV-HV-3102','RACV-IV-3103',
  'RACV-NS-3104','RACV-RP-3105','RACV-GF-3106',
  'RACV-TQ-3107'
)
ON CONFLICT (booking_id) DO NOTHING;

-- 4) Print the shareable deep-link paths (URL-safe tokens) -------------------
SELECT
  m.first_name || ' ' || m.surname                                                          AS guest,
  m.member_number                                                                           AS member,
  b.confirmation_code                                                                       AS booking,
  to_char(b.check_in, 'Dy DD Mon')  || ' to ' || to_char(b.check_out, 'Dy DD Mon YYYY')     AS dates,
  r.name                                                                                    AS resort,
  '/i/' || translate(i.token, '+/=', '-_')                                                  AS deep_link_path,
  'Login fallback: ' || m.member_number || ' / ' || m.surname                               AS login
FROM members m
JOIN bookings   b ON b.member_id     = m.id
JOIN itineraries i ON i.booking_id   = b.confirmation_code
JOIN resorts    r ON r.id            = b.resort_id
WHERE m.member_number IN ('100301','100302','100303','100304','100305','100306','100307')
ORDER BY m.member_number;
