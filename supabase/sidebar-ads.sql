-- ============================================================
-- Sidebar ads (carousel) per node
-- ============================================================

create table if not exists sidebar_ads (
  id                uuid primary key default gen_random_uuid(),
  node_id           text not null references nodes(id) on delete cascade,
  kind              text not null check (kind in ('text', 'image', 'video')),
  title             text,
  body              text,
  media_url         text,
  duration_seconds  int not null default 5 check (duration_seconds >= 2 and duration_seconds <= 120),
  sort_order        int not null default 0,
  is_active         boolean not null default true,
  created_at        timestamptz default now()
);

create index if not exists sidebar_ads_node_idx on sidebar_ads(node_id);

alter table sidebar_ads enable row level security;

drop policy if exists "sidebar_ads_public_read" on sidebar_ads;
drop policy if exists "sidebar_ads_admin_all"   on sidebar_ads;

create policy "sidebar_ads_public_read" on sidebar_ads
  for select using (is_active = true);

create policy "sidebar_ads_admin_all" on sidebar_ads
  for all to authenticated
  using (true) with check (true);

-- ตรวจสอบ
select column_name, data_type from information_schema.columns
where table_name = 'sidebar_ads' order by ordinal_position;
