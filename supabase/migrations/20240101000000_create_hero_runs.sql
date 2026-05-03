-- Migration: create hero_runs table
-- Stores hero state for active and completed runs

create table hero_runs (
  id                    uuid primary key default gen_random_uuid(),
  hero_level            integer not null default 1,
  hero_xp               integer not null default 0,
  hero_stats            jsonb   not null,
  move_pool             jsonb   not null default '[]',
  active_moveset        jsonb   not null,
  current_monster_index integer not null default 0,
  is_complete           boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
