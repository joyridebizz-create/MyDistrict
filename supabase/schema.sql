-- ============================================================
-- District Guide — Supabase Schema
-- Run this in Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================

-- NODES table
create table if not exists nodes (
  id           text primary key,        -- 'pimai', 'korat', 'ayutthaya'
  name         text not null,           -- 'อำเภอพิมาย'
  province     text,                    -- 'นครราชสีมา'
  center_lat   float8 not null,         -- 15.2200
  center_lng   float8 not null,         -- 102.4920
  default_zoom int default 15,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- PLACES table
create table if not exists places (
  id           uuid primary key default gen_random_uuid(),
  node_id      text not null references nodes(id) on delete cascade,
  name         text not null,
  name_en      text,
  name_zh      text,
  category     text not null check (category in ('tour','stay','food','cafe','car')),
  lat          float8 not null,
  lng          float8 not null,
  description  text,
  desc_en      text,
  desc_zh      text,
  price_range  text,                    -- '฿ 40/คน' หรือ 'ฟรี'
  rating       float4 default 0 check (rating >= 0 and rating <= 5),
  phone        text,
  line_id      text,
  image_url    text,
  is_active    boolean default true,
  is_featured  boolean default false,
  created_at   timestamptz default now()
);

-- Indexes
create index if not exists places_node_id_idx      on places(node_id);
create index if not exists places_node_category_idx on places(node_id, category);
create index if not exists places_featured_idx      on places(node_id, is_featured) where is_featured = true;

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

alter table nodes  enable row level security;
alter table places enable row level security;

-- Public can read active nodes
create policy "nodes_public_read" on nodes
  for select using (is_active = true);

-- Public can read active places (node_id isolation handled at query level by frontend)
create policy "places_public_read" on places
  for select using (is_active = true);

-- Authenticated admin can do everything
create policy "places_admin_all" on places
  for all using (auth.role() = 'authenticated');

create policy "nodes_admin_all" on nodes
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- Seed: pimai — first node
-- ============================================================

insert into nodes (id, name, province, center_lat, center_lng, default_zoom)
values ('pimai', 'อำเภอพิมาย', 'นครราชสีมา', 15.2200, 102.4920, 15)
on conflict (id) do nothing;

-- Sample places for pimai
insert into places (node_id, name, name_en, name_zh, category, lat, lng, description, desc_en, price_range, rating, is_featured)
values
  ('pimai', 'ปราสาทหินพิมาย', 'Phimai Historical Park', '披迈历史公园',
   'tour', 15.2238, 102.4955,
   'ปราสาทขอมที่ใหญ่ที่สุดในประเทศไทย สร้างในศตวรรษที่ 11-12',
   'The largest Khmer temple complex in Thailand, built in the 11th-12th centuries.',
   '฿ 100/คน', 4.8, true),

  ('pimai', 'พิพิธภัณฑสถานแห่งชาติพิมาย', 'Phimai National Museum', '披迈国家博物馆',
   'tour', 15.2218, 102.4931,
   'พิพิธภัณฑ์รวบรวมโบราณวัตถุจากปราสาทหินพิมาย',
   'Museum housing artifacts from Phimai and surrounding Khmer sites.',
   '฿ 100/คน', 4.5, false),

  ('pimai', 'โรงแรมพิมายอินน์', 'Phimai Inn Hotel', '披迈旅馆',
   'stay', 15.2195, 102.4912,
   'โรงแรมใจกลางเมือง ใกล้ปราสาท บรรยากาศดี',
   'Comfortable hotel in the heart of Phimai town.',
   '฿ 600–1,200/คืน', 4.2, false),

  ('pimai', 'ร้านข้าวต้มพิมาย', 'Phimai Rice Porridge', '披迈粥店',
   'food', 15.2210, 102.4908,
   'ข้าวต้มชื่อดัง เปิดตี 5 — รสชาติดั้งเดิมแท้',
   'Famous rice porridge shop, open from 5am — authentic flavours.',
   '฿ 40–80/คน', 4.6, true),

  ('pimai', 'คาเฟ่ริมน้ำ Mun River', 'Mun River Café', '文河咖啡',
   'cafe', 15.2175, 102.4890,
   'คาเฟ่วิวแม่น้ำมูล บรรยากาศผ่อนคลาย',
   'Riverside café overlooking the Mun River.',
   '฿ 80–150/แก้ว', 4.7, true),

  ('pimai', 'พิมายคาร์เร้นท์', 'Phimai Car Rent', '披迈租车',
   'car', 15.2202, 102.4935,
   'เช่ารถ มอเตอร์ไซค์ ราคาถูก บริการดี',
   'Affordable car & motorcycle rentals in Phimai.',
   '฿ 300–800/วัน', 4.3, false)
on conflict do nothing;
