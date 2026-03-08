-- Perfiles de usuario y acceso por empresa para complementar Supabase Auth metadata.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin', 'admin_empresa', 'ventas', 'inventario', 'consulta')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_company_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id text not null check (company_id in ('oz', 'pt', 'ds')),
  created_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.user_company_access enable row level security;

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
on public.user_profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "user_company_access_select_own" on public.user_company_access;
create policy "user_company_access_select_own"
on public.user_company_access
for select
to authenticated
using (auth.uid() = user_id);
