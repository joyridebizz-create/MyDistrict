export type Category = 'tour' | 'stay' | 'food' | 'cafe' | 'car'

export interface Node {
  id: string
  name: string
  province: string | null
  center_lat: number
  center_lng: number
  default_zoom: number
  is_active: boolean
  created_at: string
  /** แทนที่ SVG หมดหมู่หลักด้วยรูป (URL ใน Storage) — key = tour|stay|food|cafe|car */
  iso_pin_icons?: Partial<Record<Category, string>> | null
}

export interface Place {
  id: string
  node_id: string
  name: string
  name_en: string | null
  name_zh: string | null
  category: string          // string (not Category) to support custom categories
  lat: number
  lng: number
  description: string | null
  desc_en: string | null
  desc_zh: string | null
  price_range: string | null
  rating: number
  subcategory: string | null
  images: string[] | null        // additional gallery images (up to 5)
  phone: string | null
  line_id: string | null
  image_url: string | null
  is_active: boolean
  is_featured: boolean
  created_at: string
}

export interface CustomCategory {
  id: string           // e.g. 'temple', 'market'
  node_id: string
  label_th: string
  label_en: string | null
  label_zh: string | null
  icon: string         // emoji fallback
  icon_url: string | null  // custom building image URL (PNG/WebP)
  color: string        // hex
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface SubCategory {
  id: string           // e.g. 'northeastern', 'resort'
  node_id: string
  parent_category: string   // built-in or custom category key
  label_th: string
  label_en: string | null
  label_zh: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export type CatConfig = { icon: string; color: string; label: Record<Lang, string>; icon_url?: string | null }

export type Lang = 'th' | 'en' | 'zh'

export const CAT_CONFIG: Record<Category, CatConfig> = {
  tour: { icon: '🏛️', color: '#E8A020', label: { th: 'ท่องเที่ยว', en: 'Attractions',   zh: '景点' } },
  stay: { icon: '🏨', color: '#4A9EEB', label: { th: 'ที่พัก',     en: 'Accommodation', zh: '住宿' } },
  food: { icon: '🍜', color: '#FF6B4A', label: { th: 'อาหาร',      en: 'Food',          zh: '餐厅' } },
  cafe: { icon: '☕', color: '#C47840', label: { th: 'คาเฟ่',      en: 'Café',          zh: '咖啡' } },
  car:  { icon: '🚗', color: '#60C860', label: { th: 'รถเช่า',     en: 'Car Rental',    zh: '租车' } },
}

export const CATEGORIES: Category[] = ['tour', 'stay', 'food', 'cafe', 'car']

/** รายการ emoji ให้เลือกเป็นไอคอนหมวดหมู่ */
export const ICON_OPTIONS: string[] = [
  '🏛️','🏯','⛩️','🕌','⛪','🏟️','🎭','🎪','🎡',
  '🏨','🏩','🏪','🏫','🏬','🏗️','🏘️',
  '🍜','🍣','🍔','🍕','🍱','🥘','🍲','🥗','🍰','🧁',
  '☕','🧋','🍵','🍷','🍺','🥤',
  '🚗','🚕','🏎️','🛺','🛵','🚲','⛽',
  '🛒','💊','💈','📚','🎮','🎵','🎨','📸',
  '🌳','🌊','⛰️','🏖️','🌺','🌿','🏕️',
  '💰','🎁','🛍️','🏧','🎯','🧩','🎲',
]

/** รายการสีให้เลือก */
export const COLOR_OPTIONS: string[] = [
  '#E8A020','#FF6B4A','#4A9EEB','#C47840','#60C860',
  '#A855F7','#EC4899','#14B8A6','#F59E0B','#EF4444',
  '#6366F1','#84CC16','#06B6D4','#F97316','#8B5CF6',
]

/** คืน config ของหมวดหมู่ — built-in หรือ custom */
export function getCatConfig(
  category: string,
  customCategories: CustomCategory[] = []
): CatConfig {
  if (category in CAT_CONFIG) return CAT_CONFIG[category as Category]
  const custom = customCategories.find(c => c.id === category)
  if (custom) return {
    icon:     custom.icon,
    icon_url: custom.icon_url ?? null,
    color:    custom.color,
    label: {
      th: custom.label_th,
      en: custom.label_en ?? custom.label_th,
      zh: custom.label_zh ?? custom.label_th,
    },
  }
  return { icon: '📍', color: '#6366F1', label: { th: category, en: category, zh: category } }
}

export const I18N = {
  th: {
    app_title: 'District Guide',
    all: 'ทั้งหมด', featured: 'แนะนำ', no_places: 'ไม่พบสถานที่',
    navigate: 'นำทาง', call: 'โทร', line: 'LINE', free: 'ฟรี',
    rating: 'คะแนน', loading: 'กำลังโหลด...', map_view: 'แผนที่', list_view: 'รายการ',
  },
  en: {
    app_title: 'District Guide',
    all: 'All', featured: 'Featured', no_places: 'No places found',
    navigate: 'Navigate', call: 'Call', line: 'LINE', free: 'Free',
    rating: 'Rating', loading: 'Loading...', map_view: 'Map', list_view: 'List',
  },
  zh: {
    app_title: 'District Guide',
    all: '全部', featured: '推荐', no_places: '未找到地点',
    navigate: '导航', call: '致电', line: 'LINE', free: '免费',
    rating: '评分', loading: '加载中...', map_view: '地图', list_view: '列表',
  },
} satisfies Record<Lang, Record<string, string>>
