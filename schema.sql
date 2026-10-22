-- Esquema inicial de referencia para Supabase.
-- Revísalo y configura Auth/RLS antes de exponerlo públicamente.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Explorador',
  created_at timestamptz not null default now()
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  host_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting','playing','finished')),
  max_players int not null default 4 check (max_players between 2 and 8),
  created_at timestamptz not null default now()
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;

-- Políticas de ejemplo conservadoras. Ajusta creación/unión de salas con
-- funciones RPC/Edge Functions para evitar suplantación y límites eludibles.
create policy "profiles readable by authenticated users"
on public.profiles for select to authenticated using (true);

create policy "users insert own profile"
on public.profiles for insert to authenticated with check (auth.uid() = id);

create policy "users update own profile"
on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "authenticated users read rooms"
on public.rooms for select to authenticated using (true);

create policy "host creates own room"
on public.rooms for insert to authenticated with check (auth.uid() = host_id);

create policy "host updates own room"
on public.rooms for update to authenticated using (auth.uid() = host_id) with check (auth.uid() = host_id);

create policy "members read memberships"
on public.room_members for select to authenticated using (true);

create policy "user joins as self"
on public.room_members for insert to authenticated with check (auth.uid() = user_id);

create policy "user leaves own membership"
on public.room_members for delete to authenticated using (auth.uid() = user_id);

-- Nota: para producción, restringe lectura de miembros a salas relevantes,
-- valida el número de jugadores y evita que un usuario se una a salas llenas
-- mediante RPC/Edge Functions. Configura Realtime y autorización de canales
-- privados desde el panel de Supabase.
