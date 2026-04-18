-- ไอคอน ISO แบบกำหนดเองต่อหมวดหลัก (tour/stay/food/cafe/car) — เก็บเป็น JSON
-- ตัวอย่าง: { "tour": "https://...supabase.../place-images/phimai/iso-pins/tour.webp", "food": "..." }

alter table nodes add column if not exists iso_pin_icons jsonb default '{}'::jsonb;

comment on column nodes.iso_pin_icons is 'optional map: category key -> public image URL for built-in ISO pin override';

select column_name, data_type from information_schema.columns
where table_name = 'nodes' and column_name = 'iso_pin_icons';
