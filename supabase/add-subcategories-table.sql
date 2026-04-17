-- ============================================================
-- เพิ่มระบบ Subcategory สำหรับ District Guide
-- ============================================================

-- 1. เพิ่ม column subcategory ใน places
alter table places add column if not exists subcategory text;

-- 2. สร้างตาราง subcategories
create table if not exists subcategories (
  id              text not null,                  -- e.g. 'northeastern', 'resort'
  node_id         text not null references nodes(id) on delete cascade,
  parent_category text not null,                  -- e.g. 'food', 'stay', 'tour'
  label_th        text not null,
  label_en        text,
  label_zh        text,
  sort_order      int  default 99,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  primary key (id, node_id)
);

create index if not exists subcategories_node_parent_idx
  on subcategories(node_id, parent_category);

-- 3. RLS
alter table subcategories enable row level security;

create policy "subcategories_public_read" on subcategories
  for select using (is_active = true);

create policy "subcategories_admin_all" on subcategories
  for all to authenticated
  using (true) with check (true);

-- ============================================================
-- ตัวอย่าง default subcategories (แก้ node_id ให้ตรง)
-- ============================================================
-- insert into subcategories (id, node_id, parent_category, label_th, label_en, label_zh, sort_order) values
--   -- อาหาร
--   ('northeastern',  'phimai', 'food', 'อาหารอีสาน',    'Northeastern',    '东北菜',   1),
--   ('thai',          'phimai', 'food', 'อาหารไทย',      'Thai Food',       '泰国菜',   2),
--   ('seafood',       'phimai', 'food', 'อาหารทะเล',     'Seafood',         '海鲜',     3),
--   ('vegetarian',    'phimai', 'food', 'มังสวิรัติ',    'Vegetarian',      '素食',     4),
--   ('street_food',   'phimai', 'food', 'อาหารริมถนน',   'Street Food',     '街头美食', 5),
--   -- ที่พัก
--   ('hotel',         'phimai', 'stay', 'โรงแรม',        'Hotel',           '酒店',     1),
--   ('resort',        'phimai', 'stay', 'รีสอร์ท',       'Resort',          '度假村',   2),
--   ('guesthouse',    'phimai', 'stay', 'เกสต์เฮาส์',   'Guesthouse',      '民宿',     3),
--   ('homestay',      'phimai', 'stay', 'โฮมสเตย์',     'Homestay',        '家庭旅馆', 4),
--   -- ท่องเที่ยว
--   ('temple',        'phimai', 'tour', 'วัด/ศาสนสถาน', 'Temple',          '寺庙',     1),
--   ('park',          'phimai', 'tour', 'สวน/อุทยาน',   'Park/Nature',     '公园',     2),
--   ('museum',        'phimai', 'tour', 'พิพิธภัณฑ์',   'Museum',          '博物馆',   3),
--   ('market',        'phimai', 'tour', 'ตลาด',          'Market',          '市场',     4),
--   -- คาเฟ่
--   ('coffee',        'phimai', 'cafe', 'คาเฟ่กาแฟ',    'Coffee Shop',     '咖啡店',   1),
--   ('dessert',       'phimai', 'cafe', 'ร้านของหวาน',  'Dessert Shop',    '甜品店',   2),
--   ('bubble_tea',    'phimai', 'cafe', 'ชานมไข่มุก',   'Bubble Tea',      '珍珠奶茶', 3),
--   -- รถเช่า
--   ('car',           'phimai', 'car',  'เช่ารถยนต์',   'Car Rental',      '汽车租赁', 1),
--   ('motorbike',     'phimai', 'car',  'เช่ามอเตอร์ไซค์','Motorbike Rental','摩托车租赁',2),
--   ('bicycle',       'phimai', 'car',  'เช่าจักรยาน',  'Bicycle Rental',  '自行车',   3);

-- ตรวจสอบ
select id, node_id, parent_category, label_th from subcategories order by node_id, parent_category, sort_order;
