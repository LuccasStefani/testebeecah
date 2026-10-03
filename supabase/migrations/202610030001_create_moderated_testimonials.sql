create table public.testimonials (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 author text not null check (char_length(btrim(author)) between 2 and 80),
 body text not null check (char_length(btrim(body)) between 20 and 1000),
 instagram text check (instagram is null or instagram ~ '^[A-Za-z0-9_][A-Za-z0-9_.]{0,29}$'),
 status text not null default 'pending' check (status in ('pending','approved','rejected')),
 consent_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id) on delete set null
);
create unique index testimonials_one_pending_per_user on public.testimonials(user_id) where status = 'pending';
create index testimonials_status_created on public.testimonials(status, created_at desc);
create index testimonials_user_created on public.testimonials(user_id, created_at desc);
create index testimonials_reviewed_by on public.testimonials(reviewed_by);
alter table public.testimonials enable row level security;
revoke all on public.testimonials from anon, authenticated;
grant select(id, author, body, instagram, created_at) on public.testimonials to anon, authenticated;
grant all on public.testimonials to service_role;
create policy "Only approved testimonials are public" on public.testimonials for select to anon, authenticated using (status = 'approved');
comment on table public.testimonials is 'Customer testimonials: submissions and moderation through authenticated server routes; public clients can read approved display fields only.';
