import { useState, useMemo, useRef, useEffect, type Dispatch, type SetStateAction } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase }         from '../../lib/supabase'
import { useAuth }          from '../../hooks/useAuth'
import { usePlaces }        from '../../hooks/usePlaces'
import { useNode }          from '../../hooks/useNode'
import { useCategories }     from '../../hooks/useCategories'
import { useSubcategories }  from '../../hooks/useSubcategories'
import { useSidebarAds }     from '../../hooks/useSidebarAds'
import { PIMAI_NODE }       from '../../data/pimai-mock'
import { AdminMapPicker }   from '../../components/admin/AdminMapPicker'
import { PlaceForm }        from '../../components/admin/PlaceForm'
import { ImageUploader }    from '../../components/admin/ImageUploader'
import type { PlaceFormData } from '../../components/admin/PlaceForm'
import type { Place, Category } from '../../types/place'
import { CAT_CONFIG, CATEGORIES, getCatConfig, ICON_OPTIONS, COLOR_OPTIONS } from '../../types/place'
import type { CustomCategory } from '../../types/place'
import type { SidebarAd, SidebarAdKind } from '../../types/sidebarAd'
import { SidebarAdSlider } from '../../components/SidebarAdSlider'
import { IsoPin } from '../../components/IsoPin'
import { removeStorageFileByPublicUrl } from '../../lib/supabaseStorage'

type Tab = 'dashboard' | 'places' | 'map' | 'settings'

/* ─────────────────────────────────────────────
   Small stat card
───────────────────────────────────────────── */
function StatCard({ label, value, sub, color }: {
  label: string; value: number | string; sub?: string; color?: string
}) {
  return (
    <div className="bg-[#1a1d2b] rounded-2xl p-4 border border-white/5">
      <div className="text-gray-500 text-xs font-medium mb-1">{label}</div>
      <div className="text-white font-bold text-2xl" style={color ? { color } : {}}>
        {value}
      </div>
      {sub && <div className="text-gray-600 text-xs mt-1">{sub}</div>}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Place row in table
───────────────────────────────────────────── */
function PlaceRow({
  place, onEdit, onToggleActive, onToggleFeatured, customCategories,
}: {
  place: Place
  onEdit: (p: Place) => void
  onToggleActive: (p: Place) => void
  onToggleFeatured: (p: Place) => void
  customCategories: CustomCategory[]
}) {
  const cat = getCatConfig(place.category, customCategories)
  return (
    <tr className="border-b border-white/5 hover:bg-white/3 group transition-colors">
      {/* Category */}
      <td className="px-3 py-3 w-10">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{ background: `${cat.color}22` }}>
          {cat.icon}
        </div>
      </td>
      {/* Name */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">{place.name}</span>
          {place.is_featured && (
            <span className="text-yellow-400 text-xs bg-yellow-400/10 px-1.5 py-0.5 rounded-full">★</span>
          )}
        </div>
        {(place.name_en || place.name_zh) && (
          <div className="text-gray-600 text-xs mt-0.5">
            {place.name_en && <span className="mr-2">{place.name_en}</span>}
            {place.name_zh && <span>{place.name_zh}</span>}
          </div>
        )}
      </td>
      {/* Category label */}
      <td className="px-3 py-3 hidden sm:table-cell">
        <span className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{ background: `${cat.color}20`, color: cat.color }}>
          {cat.label.th}
        </span>
      </td>
      {/* Price */}
      <td className="px-3 py-3 hidden md:table-cell">
        <span className="text-gray-400 text-xs">{place.price_range ?? '—'}</span>
      </td>
      {/* Rating */}
      <td className="px-3 py-3 hidden md:table-cell text-center">
        {place.rating > 0
          ? <span className="text-amber-400 text-xs font-semibold">★ {place.rating.toFixed(1)}</span>
          : <span className="text-gray-600 text-xs">—</span>}
      </td>
      {/* Active toggle */}
      <td className="px-3 py-3 text-center">
        <button
          onClick={() => onToggleActive(place)}
          title={place.is_active ? 'คลิกเพื่อซ่อน' : 'คลิกเพื่อแสดง'}
          className={`w-8 h-4 rounded-full transition-colors cursor-pointer ${
            place.is_active ? 'bg-green-500' : 'bg-white/10'
          }`}
        >
          <div className={`w-3 h-3 rounded-full bg-white mx-auto transition-transform ${
            place.is_active ? 'translate-x-1.5' : '-translate-x-1.5'
          }`} style={{ marginLeft: place.is_active ? '14px' : '2px' }} />
        </button>
      </td>
      {/* Actions */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onToggleFeatured(place)}
            title={place.is_featured ? 'ยกเลิก Featured' : 'ตั้งเป็น Featured'}
            className={`p-1.5 rounded-lg text-xs transition-colors ${
              place.is_featured
                ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20'
                : 'text-gray-500 hover:text-yellow-400 hover:bg-yellow-400/10'
            }`}
          >
            ★
          </button>
          <button
            onClick={() => onEdit(place)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 text-xs transition-colors"
          >
            ✏️
          </button>
        </div>
      </td>
    </tr>
  )
}

type AdFormState = {
  kind: SidebarAdKind
  title: string
  body: string
  media_url: string
  duration_seconds: number
}

/* ─────────────────────────────────────────────
   Sidebar ads admin (Settings)
───────────────────────────────────────────── */
function SidebarAdsAdminSection({
  nodeId,
  INPUT,
  ads,
  adForm,
  setAdForm,
  adSaving,
  setAdSaving,
  showAdForm,
  setShowAdForm,
  addAd,
  updateAd,
  deleteAd,
  showToast,
}: {
  nodeId: string
  INPUT: string
  ads: SidebarAd[]
  adForm: AdFormState
  setAdForm: Dispatch<SetStateAction<AdFormState>>
  adSaving: boolean
  setAdSaving: (v: boolean) => void
  showAdForm: boolean
  setShowAdForm: Dispatch<SetStateAction<boolean>>
  addAd: (row: import('../../hooks/useSidebarAds').SidebarAdInsert) => Promise<{ message: string } | null>
  updateAd: (id: string, patch: Partial<SidebarAd>) => Promise<{ message: string } | null>
  deleteAd: (id: string) => Promise<{ message: string } | null>
  showToast: (msg: string, ok?: boolean) => void
}) {
  const videoFileRef = useRef<HTMLInputElement>(null)

  async function uploadVideo(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() === 'webm' ? 'webm' : 'mp4'
    const path = `${nodeId}/sidebar-ads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('place-images').upload(path, file, {
      contentType: file.type || `video/${ext}`,
      upsert: false,
    })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('place-images').getPublicUrl(path)
    return data.publicUrl
  }

  return (
    <div className="bg-[#1a1d2b] rounded-2xl border border-white/5 p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-white font-bold text-sm">โฆษณา Sidebar</h2>
          <p className="text-gray-500 text-xs mt-0.5">แสดงใต้เมนูหมวดหมู่ — สไลด์อัตโนมัติ + ลากซ้าย/ขวา</p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdForm(v => !v)}
          className="text-xs px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-colors font-semibold"
        >
          {showAdForm ? 'ยกเลิก' : '+ เพิ่มโฆษณา'}
        </button>
      </div>

      {/* หมายเหตุ: ขนาดที่แนะนำ (ไม่ให้ลืมตอนออกแบบ) */}
      <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/5 px-3 py-2.5 text-[11px] leading-relaxed text-amber-100/90">
        <div className="font-bold text-amber-200/95 mb-1 flex items-center gap-1.5">
          <span aria-hidden>📐</span> หมายเหตุ — ขนาดที่แนะนำ
        </div>
        <ul className="list-disc list-inside space-y-1 text-gray-400">
          <li>
            <span className="text-gray-300">พื้นที่แสดงจริงใน Sidebar:</span> กว้าง ~190–208px × สูง 88px (แบนเนอร์แนวนอน)
          </li>
          <li>
            <span className="text-gray-300">รูป:</span> ออกแบบ ~<span className="font-mono text-gray-300">800×350</span> หรือ{' '}
            <span className="font-mono text-gray-300">640×280</span> px (อัตราส่วน ~2.3:1) — วางข้อความ/โลโก้ใกล้กลางภาพเพื่อลดการถูก crop
          </li>
          <li>
            <span className="text-gray-300">วิดีโอ:</span> ความละเอียด <span className="font-mono text-gray-300">480p</span> แนวนอน (เช่น 640×360) ก็พอ — ไฟล์ไม่เกิน ~20MB ตาม Storage
          </li>
          <li>
            <span className="text-gray-300">ข้อความ:</span> เขียนสั้น ๆ (หัวข้อ ~2 บรรทัด, เนื้อหา ~4 บรรทัดบนหน้าจอ)
          </li>
        </ul>
      </div>

      {/* Preview (same component as public) */}
      {ads.filter(a => a.is_active).length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-black/20 border border-white/8">
          <div className="text-[10px] text-gray-500 mb-2 font-semibold uppercase tracking-wider">ตัวอย่าง (เฉพาะที่เปิดใช้)</div>
          <div className="max-w-[208px] mx-auto border border-white/10 rounded-xl overflow-hidden">
            <SidebarAdSlider ads={ads.filter(a => a.is_active)} />
          </div>
        </div>
      )}

      {/* List */}
      {ads.length > 0 && (
        <div className="space-y-2 mb-4">
          {ads.map(ad => (
            <div
              key={ad.id}
              className="flex items-start gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/8 text-xs"
            >
              <span className="text-[10px] font-mono uppercase text-gray-500 w-12 flex-shrink-0 pt-0.5">{ad.kind}</span>
              <div className="flex-1 min-w-0">
                <div className="text-gray-300 truncate">{ad.title || ad.body || ad.media_url || '—'}</div>
                <div className="text-gray-600 text-[10px] mt-0.5">{ad.duration_seconds}s / สไลด์</div>
              </div>
              <button
                type="button"
                title={ad.is_active ? 'ปิดการแสดง' : 'เปิดการแสดง'}
                onClick={async () => {
                  const err = await updateAd(ad.id, { is_active: !ad.is_active })
                  if (err) showToast('อัปเดตไม่สำเร็จ: ' + err.message, false)
                  else showToast(ad.is_active ? 'ปิดโฆษณาแล้ว' : 'เปิดโฆษณาแล้ว')
                }}
                className={`flex-shrink-0 text-[10px] px-2 py-1 rounded-lg font-semibold transition-colors ${
                  ad.is_active ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-gray-500'
                }`}
              >
                {ad.is_active ? 'เปิด' : 'ปิด'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm('ลบโฆษณานี้?')) return
                  const err = await deleteAd(ad.id)
                  if (err) showToast('ลบไม่สำเร็จ', false)
                  else showToast('ลบแล้ว')
                }}
                className="text-gray-600 hover:text-red-400 px-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdForm && (
        <div className="border-t border-white/5 pt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-2">ประเภท</label>
            <div className="flex rounded-xl border border-white/10 p-0.5 gap-0.5 bg-black/25">
              {([
                ['text', 'ข้อความ', '📝'] as const,
                ['image', 'รูปภาพ', '🖼️'] as const,
                ['video', 'วิดีโอ', '🎬'] as const,
              ]).map(([k, label, icon]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() =>
                    setAdForm(f => ({
                      ...f,
                      kind: k,
                      media_url: f.kind === k ? f.media_url : '',
                    }))
                  }
                  className={`flex-1 flex flex-col sm:flex-row items-center justify-center gap-0.5 py-2 px-1 rounded-lg text-[11px] font-semibold transition-colors min-h-[44px] ${
                    adForm.kind === k
                      ? 'bg-violet-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span className="text-sm leading-none">{icon}</span>
                  <span className="leading-tight text-center">{label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-gray-600 mt-1.5">
              เลือก <span className="text-gray-400">รูปภาพ</span> หรือ <span className="text-gray-400">วิดีโอ</span> แล้วอัพโหลด / วาง URL
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">หัวข้อ (ไม่บังคับ)</label>
            <input
              className={INPUT}
              value={adForm.title}
              onChange={e => setAdForm(f => ({ ...f, title: e.target.value }))}
              placeholder="หัวข้อโฆษณา"
            />
          </div>
          {adForm.kind === 'text' && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">เนื้อหา</label>
              <textarea
                className={`${INPUT} min-h-[72px] resize-y`}
                value={adForm.body}
                onChange={e => setAdForm(f => ({ ...f, body: e.target.value }))}
                placeholder="ข้อความที่ต้องการแสดง"
              />
            </div>
          )}
          {adForm.kind === 'image' && (
            <div>
              <ImageUploader
                value={adForm.media_url}
                onChange={url => setAdForm(f => ({ ...f, media_url: url }))}
                nodeId={nodeId}
                label="รูปโฆษณา"
                thumbnail
              />
            </div>
          )}
          {adForm.kind === 'video' && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-400">วิดีโอ — URL หรืออัพโหลด MP4/WebM</label>
              <input
                type="url"
                className={INPUT}
                value={adForm.media_url}
                onChange={e => setAdForm(f => ({ ...f, media_url: e.target.value }))}
                placeholder="https://.../clip.mp4"
              />
              <input ref={videoFileRef} type="file" accept="video/mp4,video/webm" className="hidden"
                onChange={async e => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (!file) return
                  setAdSaving(true)
                  try {
                    const url = await uploadVideo(file)
                    setAdForm(f => ({ ...f, media_url: url }))
                    showToast('อัพโหลดวิดีโอแล้ว ✓')
                  } catch (err) {
                    showToast(
                      'อัพโหลดไม่สำเร็จ: ' + (err instanceof Error ? err.message : '') +
                        ' — ลองใส่ URL แทน หรือรัน SQL เพิ่ม video/mp4 ใน Storage',
                      false
                    )
                  }
                  setAdSaving(false)
                }}
              />
              <button
                type="button"
                disabled={adSaving}
                onClick={() => videoFileRef.current?.click()}
                className="text-xs px-3 py-1.5 rounded-lg bg-white/8 hover:bg-white/12 text-gray-300"
              >
                📁 เลือกไฟล์วิดีโอ
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">
              ระยะเวลาแสดงแต่ละสไลด์ (วินาที): {adForm.duration_seconds}
            </label>
            <input
              type="range"
              min={2}
              max={60}
              value={adForm.duration_seconds}
              onChange={e => setAdForm(f => ({ ...f, duration_seconds: +e.target.value }))}
              className="w-full accent-violet-500"
            />
            <div className="flex justify-between text-[10px] text-gray-600">
              <span>2 วิ</span><span>60 วิ</span>
            </div>
          </div>

          <button
            type="button"
            disabled={adSaving}
            onClick={async () => {
              if (adForm.kind === 'text' && !adForm.title.trim() && !adForm.body.trim()) {
                showToast('ใส่หัวข้อหรือเนื้อหา', false)
                return
              }
              if ((adForm.kind === 'image' || adForm.kind === 'video') && !adForm.media_url.trim()) {
                showToast('ต้องมีรูปหรือวิดีโอ', false)
                return
              }
              setAdSaving(true)
              const err = await addAd({
                kind:             adForm.kind,
                title:            adForm.title.trim() || null,
                body:             adForm.kind === 'text' ? adForm.body.trim() || null : null,
                media_url:        adForm.kind !== 'text' ? adForm.media_url.trim() || null : null,
                duration_seconds: adForm.duration_seconds,
                is_active:        true,
              })
              setAdSaving(false)
              if (err) showToast('บันทึกไม่สำเร็จ: ' + err.message, false)
              else {
                showToast('เพิ่มโฆษณาแล้ว ✓')
                setAdForm({ kind: 'text', title: '', body: '', media_url: '', duration_seconds: 5 })
                setShowAdForm(false)
              }
            }}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-40"
          >
            {adSaving ? 'กำลังบันทึก...' : '+ บันทึกโฆษณา'}
          </button>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Main AdminPage
───────────────────────────────────────────── */
export function AdminPage() {
  const { nodeId = 'phimai' } = useParams<{ nodeId: string }>()
  const { user } = useAuth()

  const { node, refetch: refetchNode }                                   = useNode(nodeId)
  const { places, loading }                                              = usePlaces(nodeId)
  const { categories: customCategories, addCategory, deleteCategory }           = useCategories(nodeId)
  const { subcategories, byCategory: subcatByCategory, addSubcategory, deleteSubcategory } = useSubcategories(nodeId)
  const { ads: sidebarAdsAdmin, addAd, updateAd, deleteAd }              = useSidebarAds(nodeId, { admin: true })
  const activeNode                                                       = node ?? PIMAI_NODE

  const [tab, setTab]               = useState<Tab>('dashboard')
  const [editingPlace, setEditing]  = useState<Place | null>(null)
  const [mapFormOpen, setMapForm]   = useState(false)
  const [draft, setDraft]           = useState<{ lat: number; lng: number } | null>(null)
  const [saving, setSaving]         = useState(false)
  const [search, setSearch]         = useState('')
  const [filterCat, setFilterCat]   = useState<string>('all')
  /* category form state */
  const [catForm, setCatForm]         = useState({ id: '', label_th: '', label_en: '', label_zh: '', icon: '📍', color: '#6366F1', icon_url: '' })
  const [catSaving, setCatSaving]     = useState(false)
  const [showCatForm, setShowCatForm] = useState(false)
  /* subcategory form state */
  const [subcatForm, setSubcatForm]       = useState({ id: '', parent_category: 'food', label_th: '', label_en: '', label_zh: '' })
  const [subcatSaving, setSubcatSaving]   = useState(false)
  const [showSubcatForm, setShowSubcatForm] = useState<string | null>(null)
  /* sidebar ads form */
  const [adForm, setAdForm] = useState<{
    kind: SidebarAdKind
    title: string
    body: string
    media_url: string
    duration_seconds: number
  }>({ kind: 'text', title: '', body: '', media_url: '', duration_seconds: 5 })
  const [adSaving, setAdSaving]     = useState(false)
  const [showAdForm, setShowAdForm] = useState(false)
  /* danger zone state */
  const [dangerStep, setDangerStep]     = useState<'idle' | 'confirm' | 'verify'>('idle')
  const [dangerPassword, setDangerPassword] = useState('')
  const [dangerError, setDangerError]   = useState('')
  const [dangerBusy, setDangerBusy]     = useState(false)
  const [toast, setToast]           = useState<{ msg: string; ok: boolean } | null>(null)

  // Node settings form
  const [nodeForm, setNodeForm] = useState({
    name:         activeNode.name,
    province:     activeNode.province ?? '',
    default_zoom: activeNode.default_zoom,
  })
  const [isoPinIcons, setIsoPinIcons] = useState<Partial<Record<Category, string>>>({})

  useEffect(() => {
    setIsoPinIcons({})
  }, [nodeId])

  useEffect(() => {
    if (!node) return
    setNodeForm({
      name:         node.name,
      province:     node.province ?? '',
      default_zoom: node.default_zoom,
    })
    const icons = node.iso_pin_icons
    if (icons && typeof icons === 'object' && !Array.isArray(icons)) {
      setIsoPinIcons({ ...(icons as Partial<Record<Category, string>>) })
    } else {
      setIsoPinIcons({})
    }
  }, [node])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  /* ── Stats ── */
  const stats = useMemo(() => {
    const counts: Record<string, number> = { all: places.length }
    CATEGORIES.forEach(c => { counts[c] = places.filter(p => p.category === c).length })
    return {
      total:    places.length,
      featured: places.filter(p => p.is_featured).length,
      active:   places.filter(p => p.is_active).length,
      inactive: places.filter(p => !p.is_active).length,
      byCat:    counts,
    }
  }, [places])

  /* ── Filtered list ── */
  const filtered = useMemo(() => {
    let list = places
    if (filterCat !== 'all') list = list.filter(p => p.category === filterCat)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.name_en ?? '').toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      )
    }
    return list
  }, [places, filterCat, search])

  /* ── CRUD helpers ── */
  async function handleSave(data: PlaceFormData) {
    if (data.lat == null || data.lng == null) return
    setSaving(true)

    const payload = {
      node_id:     nodeId,
      name:        data.name.trim(),
      name_en:     data.name_en.trim()    || null,
      name_zh:     data.name_zh.trim()    || null,
      category:    data.category,
      lat:         data.lat,
      lng:         data.lng,
      description: data.description.trim() || null,
      desc_en:     data.desc_en.trim()    || null,
      desc_zh:     data.desc_zh.trim()    || null,
      subcategory: data.subcategory.trim() || null,
      price_range: data.price_range.trim() || null,
      rating:      data.rating,
      phone:       data.phone.trim()      || null,
      line_id:     data.line_id.trim()    || null,
      image_url:   data.image_url.trim()  || null,
      images:      data.images.filter(Boolean).length > 0
                   ? data.images.filter(Boolean)
                   : null,
      is_featured: data.is_featured,
      is_active:   data.is_active,
    }

    if (editingPlace) {
      const { error } = await supabase.from('places').update(payload).eq('id', editingPlace.id)
      if (error) showToast('บันทึกไม่สำเร็จ: ' + error.message, false)
      else { showToast('บันทึกเรียบร้อย ✓'); closeForm() }
    } else {
      const { error } = await supabase.from('places').insert(payload)
      if (error) showToast('เพิ่มไม่สำเร็จ: ' + error.message, false)
      else { showToast('เพิ่มสถานที่แล้ว ✓'); closeForm() }
    }
    setSaving(false)
  }

  async function handleDelete() {
    if (!editingPlace) return
    setSaving(true)
    const { error } = await supabase.from('places').delete().eq('id', editingPlace.id)
    setSaving(false)
    if (error) showToast('ลบไม่สำเร็จ: ' + error.message, false)
    else { showToast('ลบสถานที่แล้ว'); closeForm() }
  }

  async function toggleActive(place: Place) {
    await supabase.from('places').update({ is_active: !place.is_active }).eq('id', place.id)
    showToast(place.is_active ? `ซ่อน "${place.name}"` : `แสดง "${place.name}" แล้ว`)
  }

  async function toggleFeatured(place: Place) {
    await supabase.from('places').update({ is_featured: !place.is_featured }).eq('id', place.id)
    showToast(place.is_featured ? 'ยกเลิก Featured' : `★ "${place.name}" เป็น Featured แล้ว`)
  }

  async function saveNodeSettings() {
    const prev = (node?.iso_pin_icons ?? {}) as Partial<Record<Category, string>>
    const cleaned: Partial<Record<Category, string>> = {}
    for (const c of CATEGORIES) {
      const v = isoPinIcons[c]?.trim()
      if (v) cleaned[c] = v
    }
    for (const c of CATEGORIES) {
      const oldU = prev[c]?.trim()
      const newU = cleaned[c]?.trim()
      if (oldU && oldU !== newU) {
        const r = await removeStorageFileByPublicUrl(supabase, oldU)
        if (!r.ok && r.reason === 'error' && r.message) {
          console.warn('[iso_pin_icons] ลบไฟล์เก่า:', r.message)
        }
      }
    }

    const { error } = await supabase.from('nodes').update({
      name:           nodeForm.name.trim(),
      province:       nodeForm.province.trim() || null,
      default_zoom:   nodeForm.default_zoom,
      iso_pin_icons:  cleaned,
    }).eq('id', nodeId)
    if (error) showToast('บันทึกไม่สำเร็จ: ' + error.message, false)
    else {
      showToast('บันทึก Settings แล้ว ✓')
      await refetchNode()
    }
  }

  function openAdd() {
    setEditing(null)
    setDraft(null)
    setMapForm(true)
    setTab('map')
  }

  function openEdit(place: Place) {
    setEditing(place)
    setDraft({ lat: place.lat, lng: place.lng })
    setMapForm(true)
    setTab('map')
  }

  function closeForm() {
    setEditing(null)
    setMapForm(false)
    setDraft(null)
  }

  /* ─── Navigation tabs ─── */
  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'ภาพรวม',    icon: '📊' },
    { id: 'places',    label: 'สถานที่',    icon: '📍' },
    { id: 'map',       label: 'ปักหมุด',    icon: '🗺️' },
    { id: 'settings',  label: 'ตั้งค่า',    icon: '⚙️' },
  ]

  const INPUT = 'w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 transition-colors'

  return (
    <div className="h-screen flex flex-col bg-[#0f1117] font-sans overflow-hidden">

      {/* ══════════════ HEADER ══════════════ */}
      <header className="flex-shrink-0 flex items-center gap-3 px-5 py-3
        bg-[#13151e] border-b border-white/5 z-30">
        <Link to={`/${nodeId}`}
          className="text-gray-500 hover:text-white text-sm transition-colors flex items-center gap-1">
          ← แผนที่
        </Link>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <span className="text-white font-bold text-sm">{activeNode.name}</span>
          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-semibold">
            ADMIN
          </span>
        </div>

        {/* Tab bar */}
        <div className="flex items-center gap-0.5 ml-4 bg-white/5 rounded-xl p-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-white/15 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span>{t.icon}</span>
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <span className="text-gray-600 text-xs hidden md:block">{places.length} สถานที่</span>
        <button
          onClick={openAdd}
          className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          + เพิ่มสถานที่
        </button>
        <Link to="/admin"
          className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
          Nodes
        </Link>
        <div className="w-px h-4 bg-white/10" />
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-xs hidden lg:block truncate max-w-[120px]" title={user?.email}>
            {user?.email}
          </span>
          <button
            onClick={() => supabase.auth.signOut()}
            title="ออกจากระบบ"
            className="text-gray-500 hover:text-red-400 text-xs transition-colors px-2 py-1 rounded-lg hover:bg-red-500/10"
          >
            ออกจากระบบ
          </button>
        </div>
      </header>

      {/* ══════════════ CONTENT ══════════════ */}
      <div className="flex-1 overflow-hidden">

        {/* ── DASHBOARD ── */}
        {tab === 'dashboard' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-6">

              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="สถานที่ทั้งหมด" value={stats.total} sub="ใน node นี้" />
                <StatCard label="แสดงอยู่" value={stats.active}   sub="is_active = true"  color="#4ade80" />
                <StatCard label="Featured" value={stats.featured} sub="โชว์เด่น"           color="#E8A020" />
                <StatCard label="ซ่อนอยู่" value={stats.inactive} sub="is_active = false"  color="#f87171" />
              </div>

              {/* Category breakdown */}
              <div>
                <h2 className="text-white font-bold text-sm mb-3">แยกตาม Category</h2>
                <div className="grid grid-cols-5 gap-3">
                  {CATEGORIES.map(c => {
                    const cfg = CAT_CONFIG[c]
                    const n   = stats.byCat[c] ?? 0
                    const pct = stats.total > 0 ? Math.round((n / stats.total) * 100) : 0
                    return (
                      <div key={c}
                        className="bg-[#1a1d2b] rounded-2xl p-4 border border-white/5 flex flex-col items-center gap-2">
                        <div className="text-2xl">{cfg.icon}</div>
                        <div className="text-white font-bold text-xl">{n}</div>
                        <div className="text-xs text-center" style={{ color: cfg.color }}>
                          {cfg.label.th}
                        </div>
                        {/* Mini progress bar */}
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: cfg.color }} />
                        </div>
                        <div className="text-gray-600 text-xs">{pct}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Recent places */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-white font-bold text-sm">สถานที่ล่าสุด</h2>
                  <button onClick={() => setTab('places')}
                    className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                    ดูทั้งหมด →
                  </button>
                </div>
                <div className="bg-[#1a1d2b] rounded-2xl border border-white/5 overflow-hidden">
                  {loading ? (
                    <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
                      กำลังโหลด...
                    </div>
                  ) : places.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-600 gap-3">
                      <span className="text-3xl">🗺️</span>
                      <span className="text-sm">ยังไม่มีสถานที่</span>
                      <button onClick={openAdd}
                        className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                        + เพิ่มสถานที่แรก
                      </button>
                    </div>
                  ) : (
                    <table className="w-full">
                      <tbody>
                        {places.slice(0, 6).map(p => (
                          <PlaceRow key={p.id} place={p}
                            onEdit={openEdit}
                            onToggleActive={toggleActive}
                            onToggleFeatured={toggleFeatured}
                            customCategories={customCategories} />
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>

              {/* Node info */}
              <div className="bg-[#1a1d2b] rounded-2xl border border-white/5 p-4">
                <h2 className="text-white font-bold text-sm mb-3">ข้อมูล Node</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Node ID',    <code className="text-blue-400 text-xs">{nodeId}</code>],
                    ['URL',        <code className="text-green-400 text-xs">/{nodeId}</code>],
                    ['จังหวัด',   activeNode.province ?? '—'],
                    ['Default zoom', activeNode.default_zoom],
                    ['Center lat',   activeNode.center_lat.toFixed(4)],
                    ['Center lng',   activeNode.center_lng.toFixed(4)],
                  ].map(([label, val], i) => (
                    <div key={i}>
                      <div className="text-gray-500 text-xs mb-0.5">{label}</div>
                      <div className="text-gray-200 text-sm">{val as React.ReactNode}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PLACES TABLE ── */}
        {tab === 'places' && (
          <div className="h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-[#0f1117]">
              {/* Search */}
              <div className="relative flex-1 max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">🔍</span>
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="ค้นหาชื่อสถานที่..."
                  className="pl-7 pr-3 py-1.5 w-full text-xs rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Category filter */}
              <div className="flex gap-1">
                <button onClick={() => setFilterCat('all')}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                    filterCat === 'all' ? 'bg-white/15 text-white' : 'text-gray-500 hover:text-white'
                  }`}>
                  ทั้งหมด ({places.length})
                </button>
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setFilterCat(c)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      filterCat === c ? 'text-white' : 'text-gray-500 hover:text-white'
                    }`}
                    style={filterCat === c ? { background: `${CAT_CONFIG[c].color}33`, color: CAT_CONFIG[c].color } : {}}>
                    {CAT_CONFIG[c].icon} {places.filter(p => p.category === c).length}
                  </button>
                ))}
              </div>

              <div className="flex-1" />
              <span className="text-gray-600 text-xs">{filtered.length} รายการ</span>
              <button onClick={openAdd}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
                + เพิ่ม
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
                  กำลังโหลด...
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-gray-600 gap-2">
                  <span className="text-2xl">🗺️</span>
                  <span className="text-sm">ไม่พบสถานที่</span>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="sticky top-0 bg-[#0f1117] border-b border-white/5 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium w-10" />
                      <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium">ชื่อสถานที่</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium hidden sm:table-cell">หมวด</th>
                      <th className="px-3 py-2 text-left text-xs text-gray-500 font-medium hidden md:table-cell">ราคา</th>
                      <th className="px-3 py-2 text-center text-xs text-gray-500 font-medium hidden md:table-cell">คะแนน</th>
                      <th className="px-3 py-2 text-center text-xs text-gray-500 font-medium">แสดง</th>
                      <th className="px-3 py-2 w-20" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => (
                      <PlaceRow key={p.id} place={p}
                        onEdit={openEdit}
                        onToggleActive={toggleActive}
                        onToggleFeatured={toggleFeatured}
                        customCategories={customCategories} />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── MAP + FORM ── */}
        {tab === 'map' && (
          <div className="h-full flex flex-col overflow-hidden">
            {/* Map tab sub-header */}
            <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-[#13151e] border-b border-white/5">
              <button
                onClick={() => setTab('dashboard')}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white
                  px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                ← ภาพรวม
              </button>
              <div className="w-px h-4 bg-white/10" />
              <span className="text-gray-500 text-xs">
                {mapFormOpen
                  ? (editingPlace ? `แก้ไข: ${editingPlace.name}` : 'เพิ่มสถานที่ใหม่')
                  : 'คลิกบนแผนที่เพื่อปักหมุด'}
              </span>
              {mapFormOpen && (
                <>
                  <div className="flex-1" />
                  <button
                    onClick={closeForm}
                    className="text-xs text-gray-500 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    ✕ ปิด
                  </button>
                </>
              )}
            </div>

            <div className="flex-1 flex overflow-hidden">
            {/* Map */}
            <div className="flex-1 relative">
              <AdminMapPicker
                node={activeNode}
                places={places}
                draft={draft}
                selectedId={editingPlace?.id ?? null}
                customCategories={customCategories}
                onDraftChange={d => {
                  setDraft(d)
                  if (!mapFormOpen) setMapForm(true)
                }}
                onSelectPlace={p => openEdit(p)}
              />

              {/* Floating add button when form is closed */}
              {!mapFormOpen && (
                <button
                  onClick={openAdd}
                  className="absolute bottom-20 right-4 z-20 px-4 py-2.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors shadow-lg"
                >
                  + เพิ่มสถานที่
                </button>
              )}
            </div>

            {/* Form panel */}
            <div className={`flex-shrink-0 bg-[#13151e] border-l border-white/5 overflow-y-auto transition-all duration-300 ${
              mapFormOpen ? 'w-80' : 'w-0 overflow-hidden'
            }`}>
              {mapFormOpen && (
                <PlaceForm
                  initial={editingPlace}
                  draftLat={draft?.lat}
                  draftLng={draft?.lng}
                  saving={saving}
                  nodeId={nodeId}
                  customCategories={customCategories}
                  subcategories={subcategories}
                  isoPinIcons={isoPinIcons}
                  onSave={handleSave}
                  onDelete={editingPlace ? handleDelete : undefined}
                  onClose={closeForm}
                />
              )}
            </div>
            </div>{/* end flex-1 flex */}
          </div>
        )}

        {/* ── SETTINGS ── */}
        {tab === 'settings' && (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-[#1a1d2b] rounded-2xl border border-white/5 p-5">
                <h2 className="text-white font-bold text-sm mb-4">Node Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Node ID (ไม่สามารถเปลี่ยนได้)
                    </label>
                    <div className="px-3 py-2 rounded-lg bg-white/3 border border-white/5 text-gray-500 text-sm font-mono">
                      {nodeId}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">ชื่อ</label>
                    <input className={INPUT} value={nodeForm.name}
                      onChange={e => setNodeForm(f => ({ ...f, name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">จังหวัด</label>
                    <input className={INPUT} value={nodeForm.province}
                      onChange={e => setNodeForm(f => ({ ...f, province: e.target.value }))}
                      placeholder="เช่น นครราชสีมา" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 mb-1">
                      Default zoom ({nodeForm.default_zoom})
                    </label>
                    <input type="range" min={10} max={18} value={nodeForm.default_zoom}
                      onChange={e => setNodeForm(f => ({ ...f, default_zoom: +e.target.value }))}
                      className="w-full accent-blue-500" />
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>10 ภาพรวม</span><span>15 เมือง</span><span>18 ละเอียด</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
                    <div>Center lat: <span className="text-gray-300 font-mono">{activeNode.center_lat}</span></div>
                    <div>Center lng: <span className="text-gray-300 font-mono">{activeNode.center_lng}</span></div>
                  </div>
                  <p className="text-gray-600 text-xs">เปลี่ยนจุดศูนย์กลางได้ที่ <Link to="/admin" className="text-blue-400">Nodes Admin</Link></p>

                  <div className="border-t border-white/8 pt-4 mt-2 space-y-3">
                    <div>
                      <h3 className="text-white font-bold text-xs mb-0.5">ไอคอน ISO บนแผนที่ (หมวดหลัก)</h3>
                      <p className="text-[10px] text-gray-500 leading-relaxed">
                        แนะนำ <span className="text-gray-400">PNG/WebP พื้นหลังโปร่งใส</span> (~128×160px) — ถ้าไฟล์มีกรอบขาว
                        ระบบจะช่วยกลืนพื้นกับแผนที่บางส่วน แต่ผลที่ดีที่สุดคือ export ให้โปร่งใสจริงๆ (Photoshop / Photopea / remove.bg)
                        · ว่างไว้ = ใช้ SVG เดิม
                      </p>
                    </div>
                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                      {CATEGORIES.map(c => {
                        const cfg = CAT_CONFIG[c]
                        return (
                          <div key={c} className="flex gap-2 items-start rounded-xl bg-white/[0.03] border border-white/8 p-2">
                            <div className="flex flex-col items-center gap-1 flex-shrink-0 w-12 pt-1">
                              <IsoPin
                                category={c}
                                isoOverrideUrl={isoPinIcons[c]?.trim() || undefined}
                                knockoutWhiteBg={false}
                                scale={0.38}
                              />
                              <span className="text-[9px] text-gray-600 text-center leading-tight">{cfg.label.th}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <ImageUploader
                                value={isoPinIcons[c] ?? ''}
                                onChange={url => setIsoPinIcons(prev => ({ ...prev, [c]: url }))}
                                nodeId={nodeId}
                                label=""
                                thumbnail
                                placeholder={`URL รูป ${cfg.label.th}`}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <button onClick={saveNodeSettings}
                    className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors">
                    💾 บันทึก Settings
                  </button>
                </div>
              </div>

              {/* ── Sidebar Ads (carousel) ── */}
              <SidebarAdsAdminSection
                nodeId={nodeId}
                INPUT={INPUT}
                ads={sidebarAdsAdmin}
                adForm={adForm}
                setAdForm={setAdForm}
                adSaving={adSaving}
                setAdSaving={setAdSaving}
                showAdForm={showAdForm}
                setShowAdForm={setShowAdForm}
                addAd={addAd}
                updateAd={updateAd}
                deleteAd={deleteAd}
                showToast={showToast}
              />

              {/* ── Categories Manager ── */}
              <div className="bg-[#1a1d2b] rounded-2xl border border-white/5 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-white font-bold text-sm">หมวดหมู่สถานที่</h2>
                  <button
                    onClick={() => setShowCatForm(v => !v)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors font-semibold"
                  >
                    {showCatForm ? 'ยกเลิก' : '+ เพิ่มหมวดหมู่'}
                  </button>
                </div>

                {/* Built-in */}
                <div className="mb-3">
                  <div className="text-xs text-gray-500 font-semibold mb-2">หมวดหมู่ built-in</div>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => {
                      const cfg = CAT_CONFIG[c]
                      return (
                        <div key={c} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium"
                          style={{ background: `${cfg.color}18`, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
                          <span>{cfg.icon}</span>
                          <span>{cfg.label.th}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Custom */}
                {customCategories.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-gray-500 font-semibold mb-2">หมวดหมู่กำหนดเอง</div>
                    <div className="space-y-1.5">
                      {customCategories.map(c => (
                        <div key={c.id} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/8">
                          {/* Icon preview: building image or emoji */}
                          <div
                            className="w-10 h-12 flex-none rounded-lg overflow-hidden flex items-center justify-center"
                            style={{ background: `${c.color}15` }}
                          >
                            {c.icon_url
                              ? <img src={c.icon_url} alt="" className="w-full h-full object-contain p-0.5" />
                              : <span className="text-xl">{c.icon}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white font-medium">{c.label_th}</div>
                            <div className="text-xs text-gray-500 font-mono">{c.id}</div>
                            {c.icon_url && (
                              <div className="text-[10px] text-green-500 mt-0.5">✓ มีภาพ building</div>
                            )}
                          </div>
                          <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0"
                            style={{ background: c.color }} />
                          <button
                            onClick={async () => {
                              if (!confirm(`ลบหมวดหมู่ "${c.label_th}"?`)) return
                              const err = await deleteCategory(c.id)
                              if (err) showToast('ลบไม่สำเร็จ', false)
                              else showToast(`ลบ "${c.label_th}" แล้ว`)
                            }}
                            className="text-gray-600 hover:text-red-400 transition-colors text-sm ml-1"
                          >✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add form */}
                {showCatForm && (
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">
                          ID (ภาษาอังกฤษ ไม่มีช่องว่าง) *
                        </label>
                        <input
                          className={INPUT}
                          value={catForm.id}
                          onChange={e => setCatForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                          placeholder="เช่น temple, market"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">ชื่อ (ไทย) *</label>
                        <input
                          className={INPUT}
                          value={catForm.label_th}
                          onChange={e => setCatForm(f => ({ ...f, label_th: e.target.value }))}
                          placeholder="เช่น วัด, ตลาด"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Name (EN)</label>
                        <input className={INPUT} value={catForm.label_en}
                          onChange={e => setCatForm(f => ({ ...f, label_en: e.target.value }))} placeholder="e.g. Temple" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">名称 (ZH)</label>
                        <input className={INPUT} value={catForm.label_zh}
                          onChange={e => setCatForm(f => ({ ...f, label_zh: e.target.value }))} placeholder="例如：寺庙" />
                      </div>
                    </div>

                    {/* Icon picker */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">
                        ไอคอน — เลือก: <span className="text-white text-base">{catForm.icon}</span>
                      </label>
                      <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto p-2 bg-white/3 rounded-xl border border-white/8">
                        {ICON_OPTIONS.map(emoji => (
                          <button key={emoji} type="button"
                            onClick={() => setCatForm(f => ({ ...f, icon: emoji }))}
                            className="w-9 h-9 text-lg rounded-lg flex items-center justify-center transition-all hover:scale-110"
                            style={{
                              background: catForm.icon === emoji ? 'rgba(99,102,241,0.3)' : 'transparent',
                              outline: catForm.icon === emoji ? '2px solid #6366F1' : 'none',
                            }}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Color picker */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-2">
                        สี — เลือก: <span className="font-mono text-white">{catForm.color}</span>
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_OPTIONS.map(hex => (
                          <button key={hex} type="button"
                            onClick={() => setCatForm(f => ({ ...f, color: hex }))}
                            className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                            style={{
                              background: hex,
                              borderColor: catForm.color === hex ? 'white' : 'transparent',
                            }} />
                        ))}
                      </div>
                    </div>

                    {/* Building icon image upload */}
                    <div className="border-t border-white/5 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-gray-400">
                          ภาพ Isometric Building <span className="text-gray-600 font-normal">(ไม่บังคับ)</span>
                        </label>
                        {catForm.icon_url && (
                          <button
                            type="button"
                            onClick={() => setCatForm(f => ({ ...f, icon_url: '' }))}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            ✕ ลบออก
                          </button>
                        )}
                      </div>

                      {/* Preview + upload side-by-side */}
                      <div className="flex gap-3 items-start">
                        {/* Preview pin */}
                        <div className="flex-none flex flex-col items-center gap-1">
                          <div
                            className="w-14 h-[70px] rounded-lg overflow-hidden flex items-center justify-center"
                            style={{ background: `${catForm.color}12`, border: `1px solid ${catForm.color}30` }}
                          >
                            {catForm.icon_url
                              ? <img src={catForm.icon_url} alt="preview" className="w-full h-full object-contain p-0.5" />
                              : <span className="text-2xl opacity-50">{catForm.icon}</span>
                            }
                          </div>
                          <span className="text-[10px] text-gray-600">Preview</span>
                        </div>

                        {/* Uploader */}
                        <div className="flex-1 min-w-0">
                          <ImageUploader
                            value={catForm.icon_url}
                            onChange={url => setCatForm(f => ({ ...f, icon_url: url }))}
                            nodeId={nodeId}
                            label=""
                            placeholder="https://...building.png"
                            thumbnail
                          />
                        </div>
                      </div>

                      <p className="mt-1.5 text-[10px] text-gray-600 leading-relaxed">
                        อัพโหลดภาพ Isometric building (PNG/WebP พื้นหลังโปร่งใส) ขนาดแนะนำ 128×160px
                        — ถ้าไม่อัพโหลด จะใช้ไอคอน emoji แทน
                      </p>
                    </div>

                    <button
                      disabled={!catForm.id.trim() || !catForm.label_th.trim() || catSaving}
                      onClick={async () => {
                        setCatSaving(true)
                        const err = await addCategory({
                          id:         catForm.id.trim(),
                          node_id:    nodeId,
                          label_th:   catForm.label_th.trim(),
                          label_en:   catForm.label_en.trim() || null,
                          label_zh:   catForm.label_zh.trim() || null,
                          icon:       catForm.icon,
                          icon_url:   catForm.icon_url.trim() || null,
                          color:      catForm.color,
                          sort_order: 99,
                          is_active:  true,
                        })
                        setCatSaving(false)
                        if (err) showToast('เพิ่มไม่สำเร็จ: ' + err.message, false)
                        else {
                          showToast(`เพิ่มหมวดหมู่ "${catForm.label_th}" แล้ว ✓`)
                          setCatForm({ id: '', label_th: '', label_en: '', label_zh: '', icon: '📍', color: '#6366F1', icon_url: '' })
                          setShowCatForm(false)
                        }
                      }}
                      className="w-full py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors"
                    >
                      {catSaving ? 'กำลังบันทึก...' : '+ เพิ่มหมวดหมู่นี้'}
                    </button>
                  </div>
                )}
              </div>

              {/* ── Subcategories Manager ── */}
              <div className="bg-[#1a1d2b] rounded-2xl border border-white/5 p-5">
                <h2 className="text-white font-bold text-sm mb-1">หมวดหมู่ย่อย</h2>
                <p className="text-gray-500 text-xs mb-4">
                  กำหนดตัวเลือกย่อยสำหรับแต่ละหมวดหมู่ เช่น อาหาร → อาหารอีสาน, โรงแรม ฯลฯ
                </p>

                {/* List grouped by parent category */}
                {[...CATEGORIES, ...customCategories.map(c => c.id)].map(catKey => {
                  const cfg = getCatConfig(catKey, customCategories)
                  const subs = subcatByCategory[catKey] ?? []
                  const isOpen = showSubcatForm === catKey
                  return (
                    <div key={catKey} className="mb-3 last:mb-0">
                      {/* Category header */}
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1.5 text-xs font-semibold"
                          style={{ color: cfg.color }}>
                          <span>{cfg.icon}</span>
                          <span>{cfg.label.th}</span>
                          <span className="text-gray-600 font-normal">({subs.length})</span>
                        </span>
                        <button
                          onClick={() => {
                            if (isOpen) { setShowSubcatForm(null) }
                            else { setShowSubcatForm(catKey); setSubcatForm(f => ({ ...f, parent_category: catKey, id: '', label_th: '', label_en: '', label_zh: '' })) }
                          }}
                          className="text-xs px-2 py-0.5 rounded-lg bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          {isOpen ? 'ยกเลิก' : '+ เพิ่ม'}
                        </button>
                      </div>

                      {/* Existing subcategory tags */}
                      {subs.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {subs.map(sub => (
                            <span key={sub.id}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border border-white/10 bg-white/5 text-gray-300"
                            >
                              {sub.label_th}
                              <button
                                onClick={async () => {
                                  if (!confirm(`ลบ "${sub.label_th}"?`)) return
                                  const err = await deleteSubcategory(sub.id)
                                  if (err) showToast('ลบไม่สำเร็จ', false)
                                  else showToast(`ลบ "${sub.label_th}" แล้ว`)
                                }}
                                className="text-gray-600 hover:text-red-400 transition-colors leading-none ml-0.5"
                              >✕</button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Add subcategory inline form */}
                      {isOpen && (
                        <div className="bg-white/3 border border-white/8 rounded-xl p-3 space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">ID (EN) *</label>
                              <input className={INPUT} value={subcatForm.id}
                                onChange={e => setSubcatForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                                placeholder="เช่น northeastern" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">ชื่อ (ไทย) *</label>
                              <input className={INPUT} value={subcatForm.label_th}
                                onChange={e => setSubcatForm(f => ({ ...f, label_th: e.target.value }))}
                                placeholder="เช่น อาหารอีสาน" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">EN</label>
                              <input className={INPUT} value={subcatForm.label_en}
                                onChange={e => setSubcatForm(f => ({ ...f, label_en: e.target.value }))}
                                placeholder="e.g. Northeastern" />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-gray-500 mb-1">ZH</label>
                              <input className={INPUT} value={subcatForm.label_zh}
                                onChange={e => setSubcatForm(f => ({ ...f, label_zh: e.target.value }))}
                                placeholder="例：东北菜" />
                            </div>
                          </div>
                          <button
                            disabled={!subcatForm.id.trim() || !subcatForm.label_th.trim() || subcatSaving}
                            onClick={async () => {
                              setSubcatSaving(true)
                              const err = await addSubcategory({
                                id:              subcatForm.id.trim(),
                                node_id:         nodeId,
                                parent_category: catKey,
                                label_th:        subcatForm.label_th.trim(),
                                label_en:        subcatForm.label_en.trim() || null,
                                label_zh:        subcatForm.label_zh.trim() || null,
                                sort_order:      99,
                                is_active:       true,
                              })
                              setSubcatSaving(false)
                              if (err) showToast('เพิ่มไม่สำเร็จ: ' + err.message, false)
                              else {
                                showToast(`เพิ่ม "${subcatForm.label_th}" แล้ว ✓`)
                                setShowSubcatForm(null)
                              }
                            }}
                            className="w-full py-1.5 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors"
                          >
                            {subcatSaving ? 'กำลังบันทึก...' : '+ เพิ่มหมวดย่อยนี้'}
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Danger zone */}
              <div className="bg-red-500/5 rounded-2xl border border-red-500/20 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-red-400 text-base">⚠️</span>
                  <h2 className="text-red-400 font-bold text-sm">Danger Zone</h2>
                </div>
                <p className="text-gray-500 text-xs mb-4">
                  การกระทำเหล่านี้<span className="text-red-400 font-semibold">ไม่สามารถย้อนกลับได้</span> — ต้องยืนยันรหัสผ่าน admin
                </p>

                {/* Step 1: idle — show button */}
                {dangerStep === 'idle' && (
                  <button
                    onClick={() => { setDangerStep('confirm'); setDangerError('') }}
                    className="w-full py-2 rounded-xl text-sm font-semibold text-red-400 border border-red-500/30 hover:bg-red-500/10 transition-colors"
                  >
                    🗑 ลบสถานที่ทั้งหมดใน {nodeId} ({stats.total} รายการ)
                  </button>
                )}

                {/* Step 2: confirm intent */}
                {dangerStep === 'confirm' && (
                  <div className="space-y-3">
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-300">
                      คุณกำลังจะ<strong>ลบสถานที่ {stats.total} รายการ</strong>ใน <code className="bg-red-500/20 px-1 rounded">{nodeId}</code> ทั้งหมด
                      <br /><span className="text-xs text-red-400/70 mt-1 block">ข้อมูลจะหายถาวร ไม่สามารถกู้คืนได้</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDangerStep('verify')}
                        className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-colors"
                      >
                        ดำเนินการต่อ →
                      </button>
                      <button
                        onClick={() => { setDangerStep('idle'); setDangerPassword(''); setDangerError('') }}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3: password verify */}
                {dangerStep === 'verify' && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-red-400 mb-1.5">
                        🔐 ใส่รหัสผ่าน Admin เพื่อยืนยัน
                      </label>
                      <input
                        type="password"
                        autoFocus
                        value={dangerPassword}
                        onChange={e => { setDangerPassword(e.target.value); setDangerError('') }}
                        onKeyDown={async e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                        placeholder="รหัสผ่านของคุณ"
                        className="w-full px-3 py-2 text-sm rounded-lg bg-red-500/10 border border-red-500/30 text-white placeholder-red-400/40 focus:outline-none focus:border-red-400 transition-colors"
                      />
                    </div>

                    {dangerError && (
                      <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {dangerError}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        disabled={!dangerPassword || dangerBusy}
                        onClick={async () => {
                          if (!user?.email) return
                          setDangerBusy(true)
                          setDangerError('')
                          // ยืนยันรหัสผ่านกับ Supabase
                          const { error: authErr } = await supabase.auth.signInWithPassword({
                            email:    user.email,
                            password: dangerPassword,
                          })
                          if (authErr) {
                            setDangerError('รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่')
                            setDangerBusy(false)
                            return
                          }
                          // ยืนยันผ่าน — ลบข้อมูล
                          const { error: delErr } = await supabase
                            .from('places').delete().eq('node_id', nodeId)
                          setDangerBusy(false)
                          if (delErr) {
                            showToast('ลบไม่สำเร็จ: ' + delErr.message, false)
                          } else {
                            showToast(`✓ ลบ ${stats.total} สถานที่แล้ว`)
                            setDangerStep('idle')
                            setDangerPassword('')
                          }
                        }}
                        className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 disabled:opacity-40 transition-colors"
                      >
                        {dangerBusy ? '⏳ กำลังตรวจสอบ...' : '🗑 ยืนยันลบทั้งหมด'}
                      </button>
                      <button
                        onClick={() => { setDangerStep('idle'); setDangerPassword(''); setDangerError('') }}
                        className="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg ${
          toast.ok ? 'bg-green-600' : 'bg-red-600'
        } text-white`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
