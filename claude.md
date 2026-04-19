# District Guide — Local City Map Platform
## โปรเจ็ค: ระบบแผนที่ท้องถิ่น สำหรับนักท่องเที่ยว

---

## 🎯 Vision
แพลตฟอร์ม SaaS แผนที่ท้องถิ่น แบบ Multi-Node (1 node = 1 อำเภอ/เมือง)
นักท่องเที่ยวค้นหาที่พัก ร้านอาหาร คาเฟ่ ท่องเที่ยว รถเช่า ในพื้นที่นั้นได้ทันที
เจ้าของร้านปักหมุดสถานที่เอง — ผู้ดูแลจัดการแต่ละ node

---

## 🏗️ Stack

```
Frontend : Vite + React + TypeScript + Tailwind CSS
Map      : Leaflet.js + CARTO tiles + supercluster (คลัสเตอร์ + spiderfy บน React overlay)
Backend  : Supabase (PostgreSQL + RLS + Realtime + Storage)
Deploy   : Vercel
Auth     : Supabase Auth
Storage  : Supabase Storage bucket: place-images  ✅ implement แล้ว
i18n     : TH / EN / ZH (inline object ใน place.ts)
Compress : browser-image-compression (client-side → WebP)
```

---

## ☁️ Supabase Project

```
Project ID : mjdxqupjqwtxclqitfac
URL        : https://mjdxqupjqwtxclqitfac.supabase.co
Region     : (default)
.env       : VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY ใส่แล้ว
Domain     : sabaidee.cc (Vercel)
```

---

## 🗂️ Multi-Node Architecture

```
URL pattern: /:nodeId
  /          → Landing page (ทุก node)
  /phimai    → node_id = 'phimai'  ✅ มีข้อมูลแล้ว (เปลี่ยนจาก pimai)
  /korat     → node_id = 'korat'  (ยังไม่มีข้อมูล)
  /ayutthaya → node_id = 'ayutthaya' (ยังไม่มีข้อมูล)

1 node = 1 อำเภอ/เมือง
ทุก table ต้องมี node_id
ทุก query ต้องมี .eq('node_id', nodeId)
เพิ่ม node ใหม่ = INSERT 1 row ใน nodes table เท่านั้น ไม่ต้องแก้ code
```

---

## 🗄️ Supabase Schema (ทั้งหมดที่ run แล้ว)

```sql
-- NODES table
create table nodes (
  id           text primary key,
  name         text not null,
  province     text,
  center_lat   float8 not null,
  center_lng   float8 not null,
  default_zoom int default 15,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- PLACES table (ล่าสุด — มี columns เพิ่มเติม)
create table places (
  id           uuid primary key default gen_random_uuid(),
  node_id      text not null references nodes(id),
  name         text not null,
  name_en      text,
  name_zh      text,
  category     text not null,     -- ไม่มี CHECK constraint แล้ว (รองรับ custom)
  subcategory  text,              -- ✅ เพิ่มแล้ว (add-subcategories-table.sql)
  lat          float8 not null,
  lng          float8 not null,
  description  text,
  desc_en      text,
  desc_zh      text,
  price_range  text,
  rating       float4 default 0,
  phone        text,
  line_id      text,
  image_url    text,
  images       jsonb default '[]'::jsonb,  -- ✅ เพิ่มแล้ว (add-images-column.sql)
  is_active    boolean default true,
  is_featured  boolean default false,
  created_at   timestamptz default now()
);

-- CATEGORIES table (custom per node) ✅ เพิ่มแล้ว
create table categories (
  id          text,
  node_id     text references nodes(id) on delete cascade,
  label_th    text not null,
  label_en    text,
  label_zh    text,
  icon        text not null default '📍',
  color       text not null default '#6366F1',
  sort_order  int default 99,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  primary key (id, node_id)
);

-- SUBCATEGORIES table ✅ เพิ่มแล้ว
create table subcategories (
  id              text,
  node_id         text references nodes(id) on delete cascade,
  parent_category text not null,
  label_th        text not null,
  label_en        text,
  label_zh        text,
  sort_order      int default 99,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  primary key (id, node_id)
);

-- RLS
alter table nodes         enable row level security;
alter table places        enable row level security;
alter table categories    enable row level security;
alter table subcategories enable row level security;

-- Public read policies
create policy "nodes_public_read"          on nodes         for select using (is_active = true);
create policy "places_public_read"         on places        for select using (is_active = true);
create policy "categories_public_read"     on categories    for select using (is_active = true);
create policy "subcategories_public_read"  on subcategories for select using (is_active = true);

-- Admin ALL policies
create policy "nodes_admin_all"           on nodes         for all to authenticated using (true);
create policy "places_admin_all"          on places        for all to authenticated using (true);
create policy "categories_admin_all"      on categories    for all to authenticated using (true);
create policy "subcategories_admin_all"   on subcategories for all to authenticated using (true);

-- Supabase Storage
-- bucket: place-images (public, 5MB limit, jpg/png/webp/gif)
-- policies: public read, authenticated insert/update/delete
```

---

## 📁 Project Structure (ล่าสุด)

```
src/
├── components/
│   ├── DistrictMap.tsx         ← Leaflet + ISO pin + customCategories prop
│   ├── IsoPin.tsx              ← SVG per category + EmojiPin fallback (custom cat)
│   ├── PlaceCard.tsx           ← card + subcategory badge
│   ├── InfoCard.tsx            ← popup + LEFT thumbnail strip (1/6 width × 5)
│   ├── CategoryFilter.tsx
│   ├── LangToggle.tsx
│   └── admin/
│       ├── AdminMapPicker.tsx  ← map picker + customCategories
│       ├── PlaceForm.tsx       ← form 3 tabs + subcategory selector + ImageUploader
│       └── ImageUploader.tsx   ← NEW: drag-drop / browse → compress → Supabase Storage
├── pages/
│   ├── HomePage.tsx
│   ├── NodePage.tsx            ← useCategories + useSubcategories
│   ├── phimai/
│   │   └── index.tsx           ← re-export (เปลี่ยนจาก pimai/)
│   └── admin/
│       ├── AdminPage.tsx       ← + Categories Manager + Subcategory Manager + Danger Zone 3-step
│       ├── NodesAdminPage.tsx
│       └── LoginPage.tsx
├── hooks/
│   ├── usePlaces.ts
│   ├── useNode.ts
│   ├── useNodes.ts
│   ├── useGeolocation.ts
│   ├── useAuth.ts
│   ├── useCategories.ts        ← NEW: CRUD custom categories per node
│   └── useSubcategories.ts     ← NEW: CRUD subcategories per node
├── lib/
│   ├── supabase.ts
│   ├── parseGMapsURL.ts
│   └── navigate.ts
├── data/
│   └── pimai-mock.ts           ← node_id = 'phimai' (เปลี่ยนจาก pimai)
└── types/
    └── place.ts                ← + CustomCategory, SubCategory, getCatConfig(),
                                   ICON_OPTIONS, COLOR_OPTIONS
```

---

## 🔗 Routes

```
/                    → HomePage
/:nodeId             → NodePage (public map)
/admin               → NodesAdminPage (super admin)
/admin/login         → LoginPage
/admin/:nodeId       → AdminPage (protected by AuthGuard)
```

---

## ✅ สิ่งที่ทำเสร็จแล้ว — Session วันที่ 18 เม.ย. 2026

### 🗺️ Marker Clustering + Spiderfy (แผนที่ public)
```
[x] npm: supercluster + dev @types/supercluster
[x] DistrictMap: สร้างดัชนี GeoJSON Point จาก places → Supercluster.load()
[x] ทุกครั้งที่ move/zoom: getClusters(bbox, floor(zoom)) แทนการวาดหมุดทุกจุด
[x] แสดงฟองคลัสเตอร์ (ตัวเลขจำนวน) เมื่อหลายจุดรวมกลุ่ม; zoom เข้าแยกตามพฤติกรรมของ supercluster
[x] คลิกฟองคลัสเตอร์ → spiderfy: getLeaves(clusterId) จัดหมุดเป็นวงกลมรอบจุดศูนย์กลาง (พิกัดหน้าจอ)
[x] หมุดเดี่ยวจาก getClusters ยังใช้กฎเดิม visible เมื่อ zoom >= 12; คลัสเตอร์โผล่ได้แม้ zoom ต่ำกว่า (ลดความแออัด)
[x] ปิด spiderfy: คลิกแผนที่ (Leaflet), zoomstart, หรือเมื่อ places เปลี่ยน
```

### 🖼️ Sidebar โฆษณา (สไลด์)
```
[x] SidebarAdSlider: flex track ใช้ items-start / self-start — แก้พื้นดำใต้รูปจาก align-items: stretch
[x] สไลด์รูป/วิดีโอ: กรอบ aspect-[4/3] + รูป object-contain (QR/โลโก้ไม่ถูกยืดผิดสัดส่วน); วิดีโอ object-cover
```

### 🧷 ไอคอน ISO ครบทุกหมวดหลัก (built-in + custom)
```
[x] Node.iso_pin_icons: Partial<Record<string, string>> — key = id หมวด built-in หรือ custom
[x] Admin Settings: รายการช่องอัปโหลด ISO = CATEGORIES + customCategories (active) — ไม่จำกัดแค่ 5 หมวด
[x] saveNodeSettings: บันทึก + ล้างไฟล์ Storage เก่าสำหรับทุก key ที่จัดการ
[x] DistrictMap / AdminMapPicker / PlaceForm: isoOverrideUrl จาก node.iso_pin_icons[place.category] ทุกหมวด
```

### 🏠 หน้าแรก (Landing)
```
[x] HomePage / NodeCard: จุดสีบนแผนที่ย่อใช้ getCatConfig(p.category, []) แทน CAT_CONFIG[...] อย่างเดียว
    → กันหน้าขาว (crash) เมื่อมีสถานที่หมวด custom
```

---

## ✅ สิ่งที่ทำเสร็จแล้ว — Session วันที่ 17 เม.ย. 2026

### 🐛 Bug Fixes
```
[x] Rating ไม่ถูกบันทึก → เพิ่ม rating ใน PlaceFormData + save payload
[x] Star selector แสดงไม่ถูก (decimal 4.8) → ใช้ Math.round()
[x] ราคา/ดาวซ่อนอยู่ใน tab → ย้ายขึ้นมาเหนือ tab bar (เห็นตลอด)
```

### 🗂️ Custom Categories System
```
[x] supabase/add-categories-table.sql   — สร้างตาราง + drop places category CHECK
[x] src/hooks/useCategories.ts          — CRUD hook (add/delete/fetch)
[x] types/place.ts → CustomCategory interface, getCatConfig(), ICON_OPTIONS, COLOR_OPTIONS
[x] IsoPin: รับ string category + EmojiPin SVG fallback สำหรับ custom
[x] PlaceForm: แสดง built-in + custom categories ในตัวเลือก
[x] AdminPage Settings: Categories Manager (icon picker 50+ emoji, color picker 15 สี)
[x] ทุก component ใช้ getCatConfig() แทน CAT_CONFIG[] โดยตรง
```

### 📂 Subcategories System
```
[x] supabase/add-subcategories-table.sql — สร้างตาราง + places.subcategory column
[x] src/hooks/useSubcategories.ts        — CRUD hook + byCategory grouped map
[x] types/place.ts → SubCategory interface, Place.subcategory
[x] PlaceForm: subcategory selector (tag buttons) ปรากฏเมื่อมี subcategory ของหมวดนั้น
[x] AdminPage Settings: Subcategory Manager (add/delete per parent category)
[x] InfoCard: แสดง subcategory badge ใต้ category badge
[x] PlaceCard: แสดง subcategory badge
```

### 🔐 Danger Zone — Password Verification
```
[x] 3-step flow: Idle → Confirm intent → Password input
[x] ยืนยันรหัสผ่านผ่าน supabase.auth.signInWithPassword()
[x] ถ้าผิด → แสดง error ทันที ไม่ลบ
[x] ถ้าถูก → ลบข้อมูล + toast + reset state
```

### 🖼️ Gallery Images
```
[x] supabase/add-images-column.sql — images jsonb[] column ใน places
[x] types/place.ts → Place.images: string[] | null
[x] PlaceForm: จัดการ gallery images (เพิ่ม/ลบช่อง URL หรืออัพโหลด)
[x] AdminPage: images ใน save payload
[x] InfoCard: redesign มี LEFT thumbnail strip (1/6 card width × 5 ภาพ)
    - คลิก thumbnail เพื่อ highlight
    - fallback: layout เดิมถ้ามีภาพเดียว
```

### ☁️ Image Upload (Supabase Storage)
```
[x] supabase/create-storage-bucket.sql — bucket place-images + RLS policies
[x] npm install browser-image-compression
[x] src/components/admin/ImageUploader.tsx:
    - Drag-drop / click-to-browse
    - บีบอัดอัตโนมัติ → WebP (main: max 1200px/350KB, thumbnail: max 600px/150KB)
    - แสดง progress "1.2MB → 45KB"
    - อัพโหลดไป Supabase Storage (path: nodeId/timestamp.webp)
    - คืน public URL ทันที
    - มี fallback "หรือวาง URL"
[x] PlaceForm: ใช้ ImageUploader แทน text input ทั้งหมด
[x] AdminPage: pass nodeId ไปให้ PlaceForm → ImageUploader
```

---

## 📝 ไฟล์ที่ถูกสร้าง/แก้ไข — Session วันที่ 18 เม.ย. 2026

```
package.json              ← dependencies: supercluster; devDependencies: @types/supercluster
package-lock.json         ← lock ตามด้านบน

src/components/DistrictMap.tsx      ← clustering + spiderfy; iso_pin lookup ทุกหมวด (string key)
src/components/admin/AdminMapPicker.tsx ← iso_pin ทุกหมวด
src/components/admin/PlaceForm.tsx  ← isoPinIcons Record<string>; หัวฟอร์ม + ปุ่มหมวด custom ใช้ ISO override
src/components/SidebarAdSlider.tsx  ← items-start + aspect สไลด์โฆษณา (รูป contain / วิดีโอ cover)
src/pages/admin/AdminPage.tsx       ← isoPinCategoryIds; บันทึก iso_pin_icons ครบหมวด + cleanup Storage
src/pages/HomePage.tsx              ← NodeCard จุดสี: getCatConfig (กันครashes หมวด custom)
src/types/place.ts                  ← Node.iso_pin_icons → Record<string, string>
```

---

## 📝 ไฟล์ที่ถูกสร้าง/แก้ไข — Session วันที่ 17 เม.ย. 2026

### ไฟล์ใหม่
```
src/hooks/useCategories.ts               ← CRUD custom categories
src/hooks/useSubcategories.ts            ← CRUD subcategories + byCategory
src/components/admin/ImageUploader.tsx   ← drag-drop upload + compress

supabase/add-categories-table.sql        ← ✅ run แล้ว
supabase/add-subcategories-table.sql     ← ✅ run แล้ว
supabase/add-images-column.sql           ← ✅ run แล้ว
supabase/create-storage-bucket.sql       ← ✅ run แล้ว
supabase/rename-pimai-to-phimai.sql      ← ✅ run แล้ว (db migration)
```

### ไฟล์ที่แก้ไข
```
src/types/place.ts                       ← + CustomCategory, SubCategory,
                                            getCatConfig(), ICON_OPTIONS, COLOR_OPTIONS,
                                            Place.subcategory, Place.images

src/data/pimai-mock.ts                   ← node_id 'pimai' → 'phimai'
                                            + subcategory: null, images: null

src/components/IsoPin.tsx                ← string category + EmojiPin fallback
src/components/DistrictMap.tsx           ← + customCategories prop
src/components/InfoCard.tsx              ← redesign: left thumbnail strip gallery
src/components/PlaceCard.tsx             ← + subcategory badge
src/components/admin/AdminMapPicker.tsx  ← + customCategories prop
src/components/admin/PlaceForm.tsx       ← + subcategory selector
                                            + ImageUploader (แทน URL input)
                                            + rating/price above tabs
                                            + nodeId prop

src/pages/NodePage.tsx                   ← + useCategories, useSubcategories
                                            + custom category filter buttons
src/pages/admin/AdminPage.tsx            ← + useCategories, useSubcategories
                                            + Categories Manager (Settings)
                                            + Subcategory Manager (Settings)
                                            + Danger Zone 3-step password
                                            + images ใน save payload
                                            + nodeId to PlaceForm
```

---

## 🗺️ Map Architecture

### Clustering (supercluster)
```typescript
// src/components/DistrictMap.tsx
// - ไม่ใช้ L.markercluster plugin — ยังเป็น React overlay + IsoPin
new Supercluster({ radius: 72, maxZoom: 16, minZoom: 0, minPoints: 2 })
index.load(places → GeoJSON Point + properties.id)
getClusters([west,south,east,north], Math.floor(mapZoom))

// Spiderfy: คลิก cluster → getLeaves(clusterId, LEAF_LIMIT) วางมุมมองเป็นวงกลมรอบ center
// LEAF_LIMIT = 500 (ถ้ามีสถานที่ในคลัสเตอร์เดียวมากกว่านี้ต้องขยายหรือแยก UX)
```

### ISO Pin Overlay
```typescript
scale = Math.pow(2, zoom - 15) * 0.85
visible = zoom >= 12   // เฉพาะหมุดเดี่ยวจาก getClusters; ฟองคลัสเตอร์ไม่ใช้กฎนี้

// nodes.iso_pin_icons: { [categoryId: string]: imageUrl } — ทั้ง 5 หมวด built-in และ id หมวด custom
// IsoPin: isoOverrideUrl ชนะก่อน → แล้ว SVG built-in → icon_url หมวด custom → EmojiPin

// HomePage NodeCard mini-map dots: getCatConfig(p.category, []) — ยังไม่โหลด customCategories ต่อ node
// (สีหมวด custom อาจเป็น fallback จนกว่าจะดึง categories จริง — optional TODO)
```

### getCatConfig()
```typescript
// types/place.ts
getCatConfig(category: string, customCategories: CustomCategory[]): CatConfig
// 1. Check CAT_CONFIG (built-in) → return
// 2. Find in customCategories → return
// 3. Fallback { icon: '📍', color: '#6366F1' }
```

---

## 🔐 Auth / Security (Production-ready)

```
anon          → read active places/nodes/categories/subcategories ✅
anon          → write ❌ (ลบ policies แล้ว)
authenticated → ALL operations ✅
/admin/*      → AuthGuard → redirect /admin/login ✅
Danger Zone   → ต้องยืนยันรหัสผ่าน admin ก่อนลบ ✅
```

---

## 🖼️ Image System

```
Upload flow:
  1. เลือกไฟล์ (browse / drag-drop)
  2. browser-image-compression → WebP
     - main image:    max 1200px, 350KB
     - gallery image: max 600px,  150KB
  3. upload → supabase.storage.from('place-images')
     path: {nodeId}/{timestamp}-{random}.webp
  4. getPublicUrl() → บันทึกใน places.image_url หรือ places.images[]

Display:
  - places.image_url   → main thumbnail (pin icon, infocard header)
  - places.images[]    → gallery strip ด้านซ้าย InfoCard (max 5)
  - click thumbnail    → highlight + active state
```

---

## 🌐 i18n

```
LangToggle (TH/EN/ZH):
  ✅ UI labels, category labels
  ✅ Pin labels (name_en/name_zh)
  ✅ InfoCard name + description
  ✅ PlaceCard name + description
  ✅ Subcategory labels (label_en/label_zh)

AI Auto-translate (MyMemory API):
  ✅ TH → EN + ZH (name + description)
  ⚠️  5,000 chars/day limit
```

---

## 🚧 งานที่ค้างอยู่ / TODO ถัดไป

### Priority สูง
```
[ ] Vercel ENV vars check
    - VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY ต้องตั้งใน Vercel dashboard
    - redeploy หลังแก้

[ ] SEO per node
    - <title> เปลี่ยนตาม nodeId
    - og:title, og:image per node
    - meta description
```

### Priority กลาง
```
[ ] HomePage: โหลดสีหมวด custom จริงบนการ์ด node (ใช้ getCatConfig + categories ต่อ node) แทน fallback อย่างเดียว
[ ] แผนที่: จูนค่า clustering (radius, maxZoom, MIN_PIN_ZOOM) ตามการใช้งานจริง
[ ] แผนที่: ถ้าคลัสเตอร์เดียวมีมากกว่า LEAF_LIMIT (500) — เพิ่ม limit หรือแสดงข้อความ/แบ่งหน้า
[ ] Duplicate / clone node: คัดลอก places+categories+… จาก node ต้นแบบ (เช่น phimai) — ยังทำมือใน DB

[ ] Rating system จริง
    - ตาราง place_reviews (user_id, place_id, rating, comment)
    - คำนวณ avg rating (trigger หรือ view)
    - ตอนนี้ admin set ค่า rating เองได้ (1-5 ดาว) → ใช้แค่ชั่วคราว

[ ] Search / Full-text
    - ค้นหาชื่อสถานที่ทุก category พร้อมกัน
    - Supabase ilike หรือ pg_trgm

[ ] AI Translate upgrade
    - MyMemory → OpenAI API
    - ซ่อน key ใน Supabase Edge Function

[ ] Storage quota management
    - ลบไฟล์เก่าออกจาก Storage เมื่อเปลี่ยนรูป
    - แสดง storage usage ใน admin
```

### Priority ต่ำ
```
[ ] เพิ่มข้อมูลจริงสำหรับ korat, ayutthaya
[ ] Analytics (views, clicks per place)
[ ] Bulk import places (CSV)
[ ] QR Code per place
[ ] LINE LIFF integration
[ ] PWA (offline + install prompt)
[ ] i18n: ย้ายเป็น react-i18next
[ ] Subcategory filter ในหน้า public NodePage
    (ตอนนี้แค่แสดง badge ใน InfoCard/PlaceCard)
```

---

## 🐛 ปัญหาที่ยังไม่ได้แก้

```
⚠️  Clustering เป็น custom (supercluster + React) ไม่ใช่ Leaflet.markercluster
    → พฤติกรรมใกล้เคียง แต่ไม่เหมือน plugin 100% (เช่น animation การแตกคลัสเตอร์แบบ native)

⚠️  Spiderfy จำกัดที่ LEAF_LIMIT = 500 จุดต่อคลัสเตอร์
    → โหนดที่มีสถานที่หนาแน่นมากอาจต้องเพิ่มค่าหรือออกแบบ UX อื่น

⚠️  Image deletion จาก Storage
    → เมื่อเปลี่ยนรูป ไฟล์เก่าใน Storage ไม่ถูกลบ (สะสม)
    → Fix: ลบไฟล์เก่าก่อน upload ใหม่ใน ImageUploader

⚠️  Mock data ไม่มี subcategory/images จริง
    → pimai-mock.ts ใส่ null ทั้งหมด
    → Fix: เพิ่มข้อมูลจริงผ่าน admin panel

⚠️  MyMemory translate limit 5,000 chars/วัน
    → ถ้าแปลเยอะจะ error
    → Fix: อัปเกรดเป็น OpenAI Edge Function

⚠️  IsoPin scale บน mobile อาจเล็กเกินไป
    → ยังไม่ได้ทดสอบบน iOS/Android จริง
    → Fix: responsive scale หรือ min-size clamp

⚠️  Subcategory filter ใน NodePage sidebar ยังไม่มี
    → แสดงแค่ category หลัก / subcategory แสดงแค่ badge
    → Fix: เพิ่ม sub-filter dropdown หรือ chips

⚠️  korat/ayutthaya nodes ยังไม่มีข้อมูล
    → แสดง "ยังไม่มีสถานที่"

⚠️  สร้าง node ใหม่ = โครงเดียวกับ phimai ใน DB แต่ไม่ copy สถานที่/หมวด/โฆษณา — ต้องตั้งใน admin เองหรือ migrate
```

---

## 🚀 Quick Start (Dev)

```bash
npm install
cp .env.example .env
# ใส่ VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
# → http://localhost:5173/

# URLs
# /              ← Landing
# /phimai        ← แผนที่พิมาย
# /admin/login   ← Admin login
# /admin/phimai  ← Admin panel
# /admin         ← Super admin (nodes)
```

### SQL ที่ต้อง run (fresh install — ตามลำดับ)
```
1.  supabase/schema.sql                  ← tables + RLS + seed phimai
2.  supabase/fix-rls.sql                 ← แก้ places policy
3.  supabase/fix-admin-policies.sql      ← TO authenticated policies
4.  supabase/add-categories-table.sql    ← custom categories + drop category CHECK
5.  supabase/add-subcategories-table.sql ← subcategories + places.subcategory
6.  supabase/add-images-column.sql       ← places.images jsonb
7.  supabase/create-storage-bucket.sql   ← Supabase Storage bucket
8.  สร้าง admin user: Dashboard → Authentication → Users → Add user
```

---

## ⚡ Golden Rules

```
✅ ทุก table ต้องมี node_id
✅ ทุก query ต้อง .eq('node_id', nodeId)
✅ ห้าม drop/rename column เดิม (add only)
✅ RLS: public read is_active=true เสมอ
✅ CARTO tiles (ไม่ใช้ OSM ตรง — block file://)
✅ ISO pin ใช้ React state positions (ไม่ใช้ imperative DOM)
✅ แผนที่: คลัสเตอร์จาก Supercluster + state (ไม่ใช้ L.markercluster DOM)
✅ Stale closure: map event listeners ต้องใช้ ref เสมอ
✅ Mock fallback: isSupabaseConfigured() → ใช้ pimai-mock.ts
✅ i18n keys: th / en / zh ทุก text ที่ user เห็น
✅ Navigation: detect iOS/Android/Desktop
✅ getCatConfig() แทน CAT_CONFIG[] ทุกที่ (รองรับ custom categories)
✅ Image upload: compress → WebP ก่อน upload เสมอ
✅ Danger Zone: ต้องยืนยันรหัสผ่านก่อน destructive action เสมอ
```
