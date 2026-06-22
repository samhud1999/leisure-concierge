-- ============================================================================
-- RACV Member Concierge — Supabase / Postgres schema
-- Run this FIRST in the Supabase SQL Editor (before seed.sql).
-- Safe to re-run: drops and recreates all concierge tables.
-- ============================================================================

-- Clean slate (child tables first because of FKs) ----------------------------
drop table if exists event_sources cascade;
drop table if exists events cascade;
drop table if exists internal_docs cascade;
drop table if exists experiences cascade;
drop table if exists dining cascade;
drop table if exists amenities cascade;
drop table if exists room_types cascade;
drop table if exists bookings cascade;
drop table if exists members cascade;
drop table if exists resorts cascade;

-- ============================================================================
-- RESORTS  (real RACV properties)
-- ============================================================================
create table resorts (
    id           bigint generated always as identity primary key,
    slug         text unique not null,         -- e.g. 'torquay'
    name         text not null,                -- 'RACV Torquay Resort'
    type         text not null default 'resort',  -- 'resort' | 'city_hotel'
    town         text,
    state        text,
    country      text default 'Australia',
    latitude     double precision,             -- for Open-Meteo weather lookups
    longitude    double precision,
    region       text,                         -- e.g. 'Great Ocean Road / Surf Coast'
    description  text,
    created_at   timestamptz default now()
);

-- ============================================================================
-- ROOM TYPES  (per resort)
-- ============================================================================
create table room_types (
    id          bigint generated always as identity primary key,
    resort_id   bigint not null references resorts(id) on delete cascade,
    name        text not null,
    description text,
    sleeps      int,
    features    text
);

-- ============================================================================
-- AMENITIES  (per resort)  -- environment drives weather steering
-- ============================================================================
create table amenities (
    id          bigint generated always as identity primary key,
    resort_id   bigint not null references resorts(id) on delete cascade,
    name        text not null,
    category    text,                          -- 'pool','golf','spa','fitness','family',...
    environment text default 'indoor',         -- 'indoor' | 'outdoor' | 'covered'
    description text
);

-- ============================================================================
-- DINING  (per resort)
-- ============================================================================
create table dining (
    id           bigint generated always as identity primary key,
    resort_id    bigint not null references resorts(id) on delete cascade,
    name         text not null,
    cuisine      text,
    environment  text default 'indoor',        -- 'indoor' | 'outdoor' | 'covered'
    dietary_notes text,                         -- e.g. 'caters for dietary requirements'
    hours        text,
    description  text
);

-- ============================================================================
-- EXPERIENCES & ACTIVITIES  (per resort)
-- ============================================================================
create table experiences (
    id           bigint generated always as identity primary key,
    resort_id    bigint not null references resorts(id) on delete cascade,
    name         text not null,
    category     text,                          -- 'golf','spa','water','nature','culture',...
    environment  text default 'outdoor',        -- 'indoor' | 'outdoor' | 'covered'
    time_of_day  text,                          -- 'morning','afternoon','evening','any'
    description  text
);

-- ============================================================================
-- INTERNAL DOCS  (your uploaded local-area guides, etc.)
-- ============================================================================
create table internal_docs (
    id          bigint generated always as identity primary key,
    resort_id   bigint references resorts(id) on delete cascade,  -- null = global
    title       text not null,
    doc_type    text default 'local_guide',     -- 'local_guide','policy','faq',...
    content     text not null,
    source      text,
    created_at  timestamptz default now()
);

-- ============================================================================
-- EVENT SOURCES  (allow-listed sites per resort/region for events sourcing)
-- ============================================================================
create table event_sources (
    id          bigint generated always as identity primary key,
    resort_id   bigint references resorts(id) on delete cascade,  -- null = applies to all
    name        text,
    url         text not null
);

-- ============================================================================
-- EVENTS  (loaded from the allow-listed sources for a stay window)
-- ============================================================================
create table events (
    id           bigint generated always as identity primary key,
    resort_id    bigint references resorts(id) on delete set null,
    name         text not null,
    start_date   date not null,
    end_date     date,
    event_time   text,
    location     text,
    category     text,                          -- 'music','market','food_wine','sport',...
    environment  text default 'outdoor',        -- 'indoor' | 'outdoor' | 'covered'
    source_url   text,
    description  text
);

-- ============================================================================
-- MEMBERS  (dummy data for the PoC)
-- NOTE: email / phone / member_id_number are SENSITIVE — the agent must NOT
-- read these out. They live here only to model a realistic record.
-- ============================================================================
create table members (
    id                bigint generated always as identity primary key,
    member_number     text unique not null,     -- identity field #1
    surname           text not null,            -- identity field #2
    first_name        text not null,
    email             text,                     -- SENSITIVE
    phone             text,                     -- SENSITIVE
    member_id_number  text,                     -- SENSITIVE (gov id style)
    preferences       jsonb default '{}'::jsonb,-- known prefs to pre-fill the menu
    created_at        timestamptz default now()
);

-- ============================================================================
-- BOOKINGS  (dummy data; real upcoming dates)
-- ============================================================================
create table bookings (
    id                  bigint generated always as identity primary key,
    member_id           bigint not null references members(id) on delete cascade,
    resort_id           bigint not null references resorts(id),
    confirmation_code   text unique,
    check_in            date,                    -- backbone of the itinerary
    check_out           date,
    room_type           text,
    party_size          int,
    party_composition   text,                    -- 'couple','family','friends','solo'
    add_ons             text[],                  -- e.g. {'spa package','golf round'}
    other_guest_names   text[],                  -- SENSITIVE — never read out
    status              text default 'confirmed'
);

-- Helpful indexes -----------------------------------------------------------
create index on bookings (member_id);
create index on events (resort_id, start_date);
create index on amenities (resort_id);
create index on dining (resort_id);
create index on experiences (resort_id);
create index on internal_docs (resort_id);

-- Identity lookup helper: case-insensitive surname match --------------------
create index on members (member_number);
create index on members (lower(surname));
