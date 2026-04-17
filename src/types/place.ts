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
}

export interface Place {
  id: string
  node_id: string
  name: string
  name_en: string | null
  name_zh: string | null
  category: Category
  lat: number
  lng: number
  description: string | null
  desc_en: string | null
  desc_zh: string | null
  price_range: string | null
  rating: number
  phone: string | null
  line_id: string | null
  image_url: string | null
  is_active: boolean
  is_featured: boolean
  created_at: string
}

export type Lang = 'th' | 'en' | 'zh'

export const CAT_CONFIG: Record<Category, { icon: string; color: string; label: Record<Lang, string> }> = {
  tour: { icon: '🏛️', color: '#E8A020', label: { th: 'ท่องเที่ยว', en: 'Attractions', zh: '景点' } },
  stay: { icon: '🏨', color: '#4A9EEB', label: { th: 'ที่พัก',    en: 'Accommodation', zh: '住宿' } },
  food: { icon: '🍜', color: '#FF6B4A', label: { th: 'อาหาร',     en: 'Food',          zh: '餐厅' } },
  cafe: { icon: '☕', color: '#C47840', label: { th: 'คาเฟ่',     en: 'Café',           zh: '咖啡' } },
  car:  { icon: '🚗', color: '#60C860', label: { th: 'รถเช่า',    en: 'Car Rental',     zh: '租车' } },
}

export const CATEGORIES: Category[] = ['tour', 'stay', 'food', 'cafe', 'car']

export const I18N = {
  th: {
    app_title:    'พิมาย CITY MAP',
    all:          'ทั้งหมด',
    featured:     'แนะนำ',
    no_places:    'ไม่พบสถานที่',
    navigate:     'นำทาง',
    call:         'โทร',
    line:         'LINE',
    free:         'ฟรี',
    rating:       'คะแนน',
    loading:      'กำลังโหลด...',
    map_view:     'แผนที่',
    list_view:    'รายการ',
  },
  en: {
    app_title:    'PIMAI CITY MAP',
    all:          'All',
    featured:     'Featured',
    no_places:    'No places found',
    navigate:     'Navigate',
    call:         'Call',
    line:         'LINE',
    free:         'Free',
    rating:       'Rating',
    loading:      'Loading...',
    map_view:     'Map',
    list_view:    'List',
  },
  zh: {
    app_title:    '披迈城市地图',
    all:          '全部',
    featured:     '推荐',
    no_places:    '未找到地点',
    navigate:     '导航',
    call:         '致电',
    line:         'LINE',
    free:         '免费',
    rating:       '评分',
    loading:      '加载中...',
    map_view:     '地图',
    list_view:    '列表',
  },
} satisfies Record<Lang, Record<string, string>>
