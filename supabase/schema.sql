-- Ooievaarsgok: run this once in Supabase (SQL Editor).
-- The app talks to these tables only from the server with the service role key,
-- so row level security is on with no policies: the public anon key can read nothing.

create table if not exists boards (
  slug          text primary key,
  title         text not null check (char_length(title) <= 80),
  due_date      date,
  prize         text not null default '' check (char_length(prize) <= 200),
  admin_hash    text not null,
  reveal_gender text check (reveal_gender in ('boy', 'girl')),
  reveal_name   text check (char_length(reveal_name) <= 40),
  created_at    timestamptz not null default now()
);

create table if not exists guesses (
  id           uuid primary key,
  board_slug   text not null references boards(slug) on delete cascade,
  guesser_name text not null check (char_length(guesser_name) <= 40),
  gender       text not null check (gender in ('boy', 'girl')),
  baby_name    text not null check (char_length(baby_name) <= 40),
  edit_hash    text not null,
  created_at   timestamptz not null default now()
);

create index if not exists guesses_board_idx on guesses (board_slug, created_at);

alter table boards  enable row level security;
alter table guesses enable row level security;
