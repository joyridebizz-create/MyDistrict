-- ============================================================
-- เพิ่มตาราง categories สำหรับหมวดหมู่ custom per node
-- ============================================================

-- ลบ check constraint บน places.category เพื่อรองรับ custom categories
alter table places drop constraint if exists places_category_check;

-- สร้างตาราง categories
create table if not exists categories (
  id          text not null,
  node_id     text not null references nodes(id) on delete cascade,
  label_th    text not null,
  label_en    text,
  label_zh    text,
  icon        text not null default '📍',
  color       text not null default '#6366F1',
  sort_order  int  default 99,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  primary key (id, node_id)
);

-- Index
create index if not exists categories_node_idx on categories(node_id);

-- RLS
alter table categories enable row level security;

create policy "categories_public_read" on categories
  for select using (is_active = true);

create policy "categories_admin_all" on categories
  for all to authenticated
  using (true) with check (true);

-- ตรวจสอบ
select id, node_id, label_th, icon, color from categories order by node_id, sort_order;
