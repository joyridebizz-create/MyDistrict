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
Map      : Leaflet.js + CARTO tiles (ไม่ block file://)
Backend  : Supabase (PostgreSQL + RLS + Realtime)
Deploy   : Vercel Pro
Auth     : Supabase Auth (LINE LIFF optional) ← ยังไม่ได้ implement
Storage  : Supabase Storage (รูปภาพสถานที่)  ← ยังไม่ได้ implement
```

---

## ☁️ Supabase Project

```
Project ID : mjdxqupjqwtxclqitfac
URL        : https://mjdxqupjqwtxclqitfac.supabase.co
Region     : (default)
.env       : VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY ใส่แล้ว
```

---

## 🗂️ Multi-Node Architecture

```
URL pattern: /:nodeId
  /          → Landing page (ทุก node)
  /pimai     → node_id = 'pimai'  ✅ มีข้อมูลแล้ว
  /korat     → node_id = 'korat'  (mock node, ยังไม่มีข้อมูล)
  /ayutthaya → node_id = 'ayutthaya' (mock node, ยังไม่มีข้อมูล)

1 node = 1 อำเภอ/เมือง
ทุก table ต้องมี node_id
ทุก query ต้องมี .eq('node_id', nodeId)
เพิ่ม node ใหม่ = INSERT 1 row ใน nodes table เท่านั้น ไม่ต้องแก้ code
```

---

## 🗄️ Supabase Schema (ที่ run แล้ว)

```sql
-- NODES table
create table nodes (
  id           text primary key,        -- 'pimai', 'korat'
  name         text not null,           -- 'อำเภอพิมาย'
  province     text,
  center_lat   float8 not null,
  center_lng   float8 not null,
  default_zoom int default 15,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- PLACES table
create table places (
  id           uuid primary key default gen_random_uuid(),
  node_id      text not null references nodes(id),
  name         text not null,
  name_en      text,
  name_zh      text,
  category     text not null check (category in ('tour','stay','food','cafe','car')),
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
  is_active    boolean default true,
  is_featured  boolean default false,
  created_at   timestamptz default now()
);

-- RLS ที่ใช้อยู่จริง (หลังแก้บั๊ก)
alter table nodes  enable row level security;
alter table places enable row level security;

create policy "nodes_public_read"   on nodes  for select using (is_active = true);
create policy "places_public_read"  on places for select using (is_active = true);
create policy "places_admin_all"    on places for all using (auth.role() = 'authenticated');
create policy "nodes_admin_all"     on nodes  for all using (auth.role() = 'authenticated');

-- ⚠️ DEV ONLY — anon write (ต้องเปลี่ยนเป็น Auth ก่อน production)
create policy "places_anon_write"   on places for all to anon using (true) with check (true);
create policy "nodes_anon_write"    on nodes  for all to anon using (true) with check (true);
```

### SQL Files (supabase/)
```
schema.sql           ← schema หลัก + seed pimai
fix-rls.sql          ← แก้ policy places_by_node → places_public_read
admin-dev-policy.sql ← anon write สำหรับ dev (run แล้ว ✅)
```

---

## 📁 Project Structure (ที่ implement แล้ว)

```
src/
├── components/
│   ├── DistrictMap.tsx        ← Leaflet + ISO pin overlay (React state-based)
│   ├── IsoPin.tsx             ← SVG isometric building per category + animation
│   ├── PlaceCard.tsx          ← Card ในหน้า list view
│   ├── InfoCard.tsx           ← Popup overlay เมื่อคลิก pin
│   ├── CategoryFilter.tsx     ← Filter chips (all/tour/stay/food/cafe/car)
│   ├── LangToggle.tsx         ← TH / EN / ZH toggle
│   └── admin/
│       ├── AdminMapPicker.tsx ← Map with click-to-pin + GPS + GMaps URL
│       └── PlaceForm.tsx      ← Form 3 tabs (ไทย / EN+ZH / ข้อมูล)
├── pages/
│   ├── HomePage.tsx           ← Landing page ทุก node (grid cards)
│   ├── NodePage.tsx           ← Public map view (/:nodeId)
│   ├── pimai/
│   │   └── index.tsx          ← re-export NodePage
│   └── admin/
│       ├── AdminPage.tsx      ← Admin 4 tabs (Dashboard/Places/Map/Settings)
│       └── NodesAdminPage.tsx ← Super admin จัดการ nodes (/admin)
├── hooks/
│   ├── usePlaces.ts           ← Supabase realtime + mock fallback
│   ├── useNode.ts             ← Node config (center, zoom) + mock fallback
│   ├── useNodes.ts            ← All active nodes + mock fallback
│   └── useGeolocation.ts      ← GPS hook
├── lib/
│   ├── supabase.ts            ← Supabase client (no generic type)
│   ├── parseGMapsURL.ts       ← Parse Google Maps URL → lat/lng (3 patterns)
│   └── navigate.ts            ← iOS/Android/Desktop navigation
├── data/
│   └── pimai-mock.ts          ← Mock data (8 places + 3 nodes) สำหรับ offline
├── types/
│   └── place.ts               ← Place, Node, Category, Lang, CAT_CONFIG, I18N
└── styles/
    └── globals.css            ← Tailwind + pin animations (pinBob/rippleOut/smokeDrift)
```

---

## 🔗 Routes

```
/                    → HomePage (landing — ทุก node)
/:nodeId             → NodePage (public map)
/admin               → NodesAdminPage (super admin)
/admin/:nodeId       → AdminPage (place management)
```

---

## 🗺️ Map Architecture

### ISO Pin Overlay (React state-based — ไม่ใช้ imperative DOM)
```typescript
// map.on('move/zoom') → recalcPinsRef.current() → setPinPositions([{x,y,scale}])
// React render → <div style={{left:x, top:y}}><IsoPin /></div>

// ⚠️ Critical: ใช้ ref เพื่อหลีกเลี่ยง stale closure
const recalcPinsRef = useRef<() => void>(null as any)
recalcPinsRef.current = recalcPins  // update ทุก render
const update = () => recalcPinsRef.current()  // event listener ใช้ ref เสมอ
```

### Scale
```typescript
scale = Math.pow(2, zoom - 15) * 0.85
visible = zoom >= 12
```

### CARTO Tile Styles
```
Retro    : rastertiles/voyager
Dark     : dark_all
Satellite: light_all
```

### ISO Building SVGs (per category)
- **tour** : ปราสาทหิน 3 ชั้น สีน้ำตาลทอง `#C8901E`
- **stay** : อาคารสูง สีน้ำเงิน มีไฟหน้าต่าง `#3A7EC4`
- **food** : ร้านมีกันสาด สีส้ม-แดง `#E05830`
- **cafe** : บ้านหลังคาสองชั้น สีน้ำตาล `#9C6030`
- **car**  : โรงรถสีเขียว มีรถจอด `#3A9A48`

---

## 🔄 Data Flow

### usePlaces — Mock fallback
```typescript
// Auto-detect: ถ้า VITE_SUPABASE_URL เป็น placeholder → ใช้ mock data
if (!isSupabaseConfigured()) {
  setPlaces(PIMAI_PLACES.filter(p => p.node_id === nodeId && p.is_active))
  return
}
// ถ้า config จริง → query Supabase + realtime subscription
```

### Realtime subscription
```typescript
supabase
  .channel(`places:${nodeId}`)
  .on('postgres_changes', {
    event: '*', schema: 'public', table: 'places',
    filter: `node_id=eq.${nodeId}`
  }, () => fetchPlaces())
  .subscribe()
```

---

## 🔐 Auth / Security

### ปัจจุบัน ✅ Production-ready
```
anon        → read active places/nodes ✅
anon        → write places/nodes ❌ (policies ถูกลบแล้ว)
authenticated → ALL operations ✅
/admin/*    → AuthGuard — redirect ไป /admin/login ถ้ายัง login
```

### RLS Policies ที่ active (หลัง fix-admin-policies.sql)
```
nodes_admin_all    → for ALL  to authenticated  (เพิ่ม/แก้/ลบ node)
nodes_public_read  → for SELECT to public       (อ่านเฉพาะ is_active=true)
places_admin_all   → for ALL  to authenticated  (เพิ่ม/แก้/ลบ place)
places_public_read → for SELECT to public       (อ่านเฉพาะ is_active=true)
```

### Admin User
```
สร้างผ่าน Supabase Dashboard → Authentication → Users → Add user
Email: ตามที่ตั้ง
```

### Files ที่เกี่ยวข้อง
```
src/hooks/useAuth.ts               ← Supabase session listener
src/components/AuthGuard.tsx       ← Route protection (redirect to login)
src/pages/admin/LoginPage.tsx      ← Login form (/admin/login)
supabase/secure-admin.sql          ← drop anon write policies (run แล้ว ✅)
supabase/fix-admin-policies.sql    ← TO authenticated policies (run แล้ว ✅)
```

---

## 📍 การปักหมุด (Admin) — 3 วิธี

```typescript
// 1. คลิกบนแผนที่
map.on('click', (e) => { lat = e.latlng.lat; lng = e.latlng.lng })

// 2. GPS ปัจจุบัน
navigator.geolocation.getCurrentPosition(pos => { ... })

// 3. Parse Google Maps URL (lib/parseGMapsURL.ts)
// รองรับ 3 patterns: ?q=, @lat,lng, !3d!4d
```

---

## 🧭 Navigation (lib/navigate.ts)

```typescript
function navigate(lat, lng, name?) {
  if (isIOS)     → maps://maps.apple.com/?daddr=...
  if (isAndroid) → google.navigation:q=...
  else           → https://www.google.com/maps/dir/...
}
```

---

## 🏪 Categories & i18n

```typescript
type Category = 'tour' | 'stay' | 'food' | 'cafe' | 'car'
type Lang     = 'th' | 'en' | 'zh'

// CAT_CONFIG และ I18N อยู่ใน src/types/place.ts
// i18n ใช้ inline object (ยังไม่ใช้ react-i18next)
// ทุก text มี .th / .en / .zh
```

---

## 💰 Business Model

```
1. SaaS รายเดือน (อบต./เทศบาล)
   Free       → 10 places
   Starter    → ฿490/เดือน  → 50 places
   Pro        → ฿990/เดือน  → unlimited + analytics
   Enterprise → ฿3,900/เดือน → white-label

2. Listing Fee (ร้านค้า)
   Featured → ฿199/เดือน → อยู่ด้านบน + badge
   Verified → ฿399/เดือน → tick + stats

3. Navigation Commission → Booking 3–10%
4. White-Label License   → ฿15,000–30,000 ครั้งเดียว

Strategy: Traffic ก่อน → ค่อยขาย
  Phase 1: Deploy พิมาย ฟรี 100% ← อยู่ตรงนี้
  Phase 2: SEO + TikTok → 1,000+ คน/เดือน
  Phase 3: Monetize เมื่อมี proof
```

---

## 🔗 Synergy กับ JoyRide

```
District Guide → นักท่องเที่ยวดูสถานที่ → ต้องการเดินทาง
                                                ↓
                              JoyRide (LINE LIFF) → เรียกรถ

ใช้ Supabase project เดียวกัน
ใช้ node_id structure เดียวกัน
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
✅ Stale closure: map event listeners ต้องใช้ ref เสมอ
✅ Mock fallback: isSupabaseConfigured() → ใช้ pimai-mock.ts
✅ i18n keys: th / en / zh ทุก text ที่ user เห็น
✅ Navigation: detect iOS/Android/Desktop
✅ Admin: รองรับ click map / GPS / Google Maps URL
```

---

## ✅ สิ่งที่ทำเสร็จแล้ว (Session วันที่ 17 เม.ย. 2025)

```
[x] Vite + React + TypeScript + Tailwind CSS project setup
[x] Supabase schema: nodes + places tables + indexes + RLS
[x] Seed data: pimai node + 6 ตัวอย่างสถานที่
[x] DistrictMap component: Leaflet + CARTO tiles + ISO overlay
[x] IsoPin component: SVG isometric 5 category + pinBob animation
[x] usePlaces hook: Supabase realtime + mock fallback + node isolation
[x] useNode / useNodes hooks + mock fallback
[x] Mock data: 8 places พิมาย + 3 nodes (pimai/korat/ayutthaya)
[x] NodePage: dark sidebar layout + category filter + lang toggle
[x] HomePage: landing page ทุก node แบ่งตามจังหวัด
[x] AdminPage: 4 tabs (Dashboard / Places Table / Map Pin / Settings)
[x] NodesAdminPage: สร้าง/แก้ไข/toggle node + center map picker
[x] AdminMapPicker: click + GPS + Google Maps URL
[x] PlaceForm: 3 tabs (TH / EN+ZH / ข้อมูลทั่วไป) + ISO category picker
[x] InfoCard: popup dark theme + navigate/call/line buttons
[x] PlaceCard: list view card
[x] CategoryFilter + LangToggle components
[x] lib/parseGMapsURL.ts: 3 URL patterns
[x] lib/navigate.ts: iOS/Android/Desktop detect
[x] RLS fix: places_public_read (is_active=true)
[x] Admin dev policy: anon write (DEV ONLY)
[x] Bug fix: pins หายตอนซูม (stale closure → ref fix)
[x] Bug fix: Supabase เชื่อมต่อแล้ว (mjdxqupjqwtxclqitfac)
[x] Routing: / → Home, /:nodeId → Map, /admin → Nodes, /admin/:nodeId → Admin
```

---

## 📝 ไฟล์ที่ถูกสร้าง/แก้ไข

### Config & Root
```
package.json
vite.config.ts
tsconfig.json / tsconfig.app.json / tsconfig.node.json
tailwind.config.js
postcss.config.js
index.html
.env                        ← SUPABASE_URL + ANON_KEY (อย่า commit!)
.env.example
.gitignore
```

### Source
```
src/main.tsx
src/App.tsx                 ← routes: / /admin /admin/:nodeId /:nodeId
src/vite-env.d.ts
src/styles/globals.css      ← Tailwind + pin animations

src/types/place.ts          ← Place, Node, Category, Lang, CAT_CONFIG, I18N

src/lib/supabase.ts         ← createClient (no generic)
src/lib/parseGMapsURL.ts
src/lib/navigate.ts

src/data/pimai-mock.ts      ← PIMAI_NODE, PIMAI_PLACES, MOCK_NODES, isSupabaseConfigured()

src/hooks/usePlaces.ts      ← realtime + mock fallback + node isolation
src/hooks/useNode.ts        ← single node + mock fallback
src/hooks/useNodes.ts       ← all nodes + mock fallback
src/hooks/useGeolocation.ts

src/components/DistrictMap.tsx    ← Leaflet + ISO overlay (recalcPinsRef fix)
src/components/IsoPin.tsx         ← SVG buildings + selected/featured props
src/components/InfoCard.tsx       ← dark popup
src/components/PlaceCard.tsx
src/components/CategoryFilter.tsx
src/components/LangToggle.tsx
src/components/admin/AdminMapPicker.tsx
src/components/admin/PlaceForm.tsx

src/pages/HomePage.tsx
src/pages/NodePage.tsx
src/pages/pimai/index.tsx
src/pages/admin/AdminPage.tsx      ← 4-tab admin dashboard
src/pages/admin/NodesAdminPage.tsx
```

### Supabase SQL (run ใน SQL Editor แล้ว)
```
supabase/schema.sql              ← ✅ run แล้ว (schema + seed pimai)
supabase/fix-rls.sql             ← ✅ run แล้ว (แก้ places_by_node)
supabase/admin-dev-policy.sql    ← ✅ run แล้ว (anon write — dev only)
supabase/secure-admin.sql        ← ✅ run แล้ว (ลบ anon write policies)
supabase/fix-admin-policies.sql  ← ✅ run แล้ว (TO authenticated — production)
supabase/create-admin.sql        ← ✅ admin user สร้างผ่าน Dashboard แล้ว
```

---

## ✅ สิ่งที่ทำเสร็จแล้ว (Session วันที่ 17 เม.ย. 2026 — ต่อ)

```
[x] Auth: useAuth hook (Supabase session listener)
[x] Auth: LoginPage (/admin/login) — dark theme, email/password
[x] Auth: AuthGuard component — redirect ถ้ายัง login
[x] Auth: ครอบ /admin + /admin/:nodeId ด้วย AuthGuard
[x] Auth: ปุ่ม "ออกจากระบบ" ใน AdminPage + NodesAdminPage header
[x] RLS: ลบ anon write policies (secure-admin.sql)
[x] RLS: แก้เป็น TO authenticated (fix-admin-policies.sql)
[x] RLS: policies ตอนนี้ = {authenticated} ALL + {public} SELECT
[x] i18n: pin label บนแผนที่เปลี่ยนตาม lang toggle (TH/EN/ZH)
[x] i18n: DistrictMap รับ lang prop, ใช้ name_en/name_zh
[x] AI Translate: ปุ่ม "🤖 แปลอัตโนมัติ" ใน PlaceForm (MyMemory API)
    - แปล TH → EN + ZH พร้อมกัน (name + description)
    - ฟรี ไม่ต้องใช้ API key
    - มีปุ่ม shortcut ใน tab ไทย และ tab EN/ZH
[x] UX: เพิ่ม back button "← ภาพรวม" ใน Map tab ของ AdminPage
[x] UX: sub-header บน Map tab แสดง breadcrumb + status
```

---

## 📝 ไฟล์ที่ถูกสร้าง/แก้ไข (Session วันที่ 17 เม.ย. 2026)

### ไฟล์ใหม่
```
src/hooks/useAuth.ts               ← Supabase auth session hook
src/components/AuthGuard.tsx       ← Route protection wrapper
src/pages/admin/LoginPage.tsx      ← Admin login page (/admin/login)
supabase/secure-admin.sql          ← drop anon write policies
supabase/fix-admin-policies.sql    ← TO authenticated policies
supabase/create-admin.sql          ← วิธีสร้าง admin user
```

### ไฟล์ที่แก้ไข
```
src/App.tsx                        ← เพิ่ม /admin/login route + AuthGuard
src/components/DistrictMap.tsx     ← เพิ่ม lang prop, pin label localized
src/components/admin/PlaceForm.tsx ← ปุ่มแปลอัตโนมัติ (MyMemory API)
src/pages/NodePage.tsx             ← ส่ง lang ไปให้ DistrictMap
src/pages/admin/AdminPage.tsx      ← back button + sub-header ใน Map tab
                                      + ปุ่มออกจากระบบ + import useAuth
src/pages/admin/NodesAdminPage.tsx ← ปุ่มออกจากระบบ + import useAuth
```

---

## 🔐 Auth / Security (ปัจจุบัน — Production-ready)

```
anon        → read active places/nodes ✅
anon        → write places/nodes ❌ (policies ถูกลบแล้ว)
authenticated → ALL operations ✅ (TO authenticated)
/admin/*    → AuthGuard — redirect ไป /admin/login ถ้ายัง login ✅
```

### RLS Policies ที่ active
```
nodes_admin_all    → ALL  TO authenticated   ✅
nodes_public_read  → SELECT TO public        ✅
places_admin_all   → ALL  TO authenticated   ✅
places_public_read → SELECT TO public        ✅
```

---

## 🌐 i18n — ปัจจุบัน

```
LangToggle (TH/EN/ZH) เปลี่ยน:
  ✅ UI labels (sidebar, buttons, ข้อความต่างๆ)
  ✅ Category labels ใน sidebar
  ✅ Pin labels บนแผนที่ (name_en / name_zh)
  ✅ InfoCard popup (name + description)
  ✅ PlaceCard list view (name + description)

AI Auto-translate ใน Admin:
  ✅ กดปุ่ม "🤖 แปลอัตโนมัติ" → แปล TH → EN + ZH
  ✅ ใช้ MyMemory API (ฟรี 5,000 chars/day)
  ⚠️  limit: 5,000 chars/day (upgrade OpenAI ได้ทีหลัง)
```

---

## 🚧 งานที่ค้างอยู่ / TODO ถัดไป

### Priority สูง (ก่อน deploy)
```
[ ] Deploy Vercel
    - vercel.json: rewrite /* → index.html (SPA routing)
    - เพิ่ม env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
    - Custom domain (optional)

[ ] SEO per node
    - <title> + <meta description> เปลี่ยนตาม nodeId
    - og:title, og:image per node
```

### Priority กลาง
```
[ ] Image Upload (Supabase Storage)
    - Storage bucket: place-images
    - Upload component ใน PlaceForm (แทน URL string)
    - Resize/compress ก่อน upload

[ ] Rating system
    - ตาราง place_reviews (user_id, place_id, rating, comment)
    - คำนวณ avg rating อัตโนมัติ (trigger หรือ view)

[ ] Search / Full-text
    - ค้นหาชื่อสถานที่ทุก category พร้อมกัน
    - Supabase: ilike หรือ pg_trgm full-text

[ ] AI Translate upgrade
    - เปลี่ยนจาก MyMemory → OpenAI API (คุณภาพดีกว่า)
    - Supabase Edge Function เพื่อซ่อน API key
```

### Priority ต่ำ
```
[ ] เพิ่มข้อมูลจริงสำหรับ korat, ayutthaya nodes
[ ] Analytics dashboard (views, clicks per place)
[ ] Bulk import places (CSV upload)
[ ] QR Code per place
[ ] LINE LIFF integration
[ ] PWA (offline support + install prompt)
[ ] i18n: ย้ายเป็น react-i18next (th.json/en.json/zh.json)
```

---

## 🐛 ปัญหาที่ยังไม่ได้แก้

```
⚠️  Mock data มีแค่ pimai
    → korat/ayutthaya แสดง "ยังไม่มีสถานที่"
    → Fix: เพิ่ม seed SQL หรือเพิ่มผ่าน admin panel

⚠️  image_url รับแค่ URL string
    → ต้อง copy URL มาวางเอง ไม่สะดวก
    → Fix: Supabase Storage + upload component

⚠️  MyMemory API limit 5,000 chars/วัน
    → ถ้าแปลเยอะจะ error
    → Fix: อัปเกรดเป็น OpenAI Edge Function

⚠️  IsoPin scale บน mobile อาจเล็กเกินไป
    → ยังไม่ได้ทดสอบบน iOS/Android จริง
    → Fix: responsive scale หรือ min-size clamp

⚠️  i18n ยังเป็น inline object ใน place.ts
    → ยาก scale เมื่อมีหลาย text/ภาษา
    → Fix: react-i18next + translation files (low priority)
```

---

## 🚀 Quick Start (Dev)

```bash
# 1. Install
npm install

# 2. Copy env
cp .env.example .env
# ใส่ VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY

# 3. Run
npm run dev
# → http://localhost:5173/

# URLs
# http://localhost:5173/           ← Landing page
# http://localhost:5173/pimai      ← แผนที่พิมาย
# http://localhost:5173/admin/login ← Admin login
# http://localhost:5173/admin/pimai ← Admin panel
# http://localhost:5173/admin       ← Super admin
```

### Supabase SQL ที่ต้อง run (ตามลำดับ — fresh install)
```
1. supabase/schema.sql              ← tables + RLS + seed
2. supabase/fix-rls.sql             ← แก้ places policy
3. supabase/fix-admin-policies.sql  ← TO authenticated policies
4. สร้าง admin user: Dashboard → Authentication → Users → Add user
```
