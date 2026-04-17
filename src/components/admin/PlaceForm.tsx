import { useState, useEffect } from 'react'
import { IsoPin } from '../IsoPin'
import type { Place, CustomCategory } from '../../types/place'
import { CAT_CONFIG, CATEGORIES, getCatConfig } from '../../types/place'

export interface PlaceFormData {
  name:        string
  name_en:     string
  name_zh:     string
  category:    string
  lat:         number | null
  lng:         number | null
  description: string
  desc_en:     string
  desc_zh:     string
  price_range: string
  rating:      number
  phone:       string
  line_id:     string
  image_url:   string
  is_featured: boolean
  is_active:   boolean
}

const EMPTY: PlaceFormData = {
  name: '', name_en: '', name_zh: '',
  category: 'tour',
  lat: null, lng: null,
  description: '', desc_en: '', desc_zh: '',
  price_range: '', rating: 0,
  phone: '', line_id: '', image_url: '',
  is_featured: false, is_active: true,
}

interface PlaceFormProps {
  initial?:          Place | null
  draftLat?:         number | null
  draftLng?:         number | null
  saving:            boolean
  customCategories?: CustomCategory[]
  onSave:            (data: PlaceFormData) => void
  onDelete?:         () => void
  onClose:           () => void
}

type TabKey = 'th' | 'en_zh' | 'info'

const INPUT = 'w-full px-3 py-2 text-sm rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-blue-400 transition-colors'
const LABEL = 'block text-xs font-semibold text-gray-400 mb-1'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {children}
    </div>
  )
}

export function PlaceForm({ initial, draftLat, draftLng, saving, customCategories = [], onSave, onDelete, onClose }: PlaceFormProps) {
  const isEdit = !!initial
  const [tab, setTab] = useState<TabKey>('th')
  const [data, setData] = useState<PlaceFormData>(() => {
    if (initial) {
      return {
        name:        initial.name,
        name_en:     initial.name_en    ?? '',
        name_zh:     initial.name_zh    ?? '',
        category:    initial.category,
        lat:         initial.lat,
        lng:         initial.lng,
        description: initial.description ?? '',
        desc_en:     initial.desc_en    ?? '',
        desc_zh:     initial.desc_zh    ?? '',
        price_range: initial.price_range ?? '',
        rating:      initial.rating      ?? 0,
        phone:       initial.phone       ?? '',
        line_id:     initial.line_id     ?? '',
        image_url:   initial.image_url   ?? '',
        is_featured: initial.is_featured,
        is_active:   initial.is_active,
      }
    }
    return { ...EMPTY }
  })

  const [errors, setErrors] = useState<Partial<Record<keyof PlaceFormData, string>>>({})
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [translating, setTranslating] = useState(false)
  const [translateError, setTranslateError] = useState<string | null>(null)

  // Sync draft lat/lng from map click
  useEffect(() => {
    if (draftLat != null && draftLng != null) {
      setData(d => ({ ...d, lat: draftLat, lng: draftLng }))
    }
  }, [draftLat, draftLng])

  function set<K extends keyof PlaceFormData>(key: K, val: PlaceFormData[K]) {
    setData(d => ({ ...d, [key]: val }))
    setErrors(e => ({ ...e, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: typeof errors = {}
    if (!data.name.trim())      errs.name     = 'กรุณาใส่ชื่อสถานที่'
    if (data.lat == null)       errs.lat      = 'ยังไม่ได้ปักหมุด'
    if (data.lng == null)       errs.lng      = 'ยังไม่ได้ปักหมุด'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    onSave(data)
  }

  async function translateText(text: string, targetLang: 'en' | 'zh'): Promise<string> {
    const pair = targetLang === 'zh' ? 'th|zh' : 'th|en'
    const res  = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`
    )
    const json = await res.json()
    if (json.responseStatus !== 200) throw new Error(json.responseDetails ?? 'Translation failed')
    return json.responseData.translatedText as string
  }

  async function handleAutoTranslate() {
    if (!data.name.trim()) {
      setTranslateError('กรุณาใส่ชื่อสถานที่ภาษาไทยก่อน')
      return
    }
    setTranslating(true)
    setTranslateError(null)
    try {
      const [nameEn, nameZh, descEn, descZh] = await Promise.all([
        translateText(data.name, 'en'),
        translateText(data.name, 'zh'),
        data.description.trim() ? translateText(data.description, 'en') : Promise.resolve(''),
        data.description.trim() ? translateText(data.description, 'zh') : Promise.resolve(''),
      ])
      setData(d => ({
        ...d,
        name_en: nameEn,
        name_zh: nameZh,
        desc_en: descEn,
        desc_zh: descZh,
      }))
      setTab('en_zh')
    } catch {
      setTranslateError('แปลไม่สำเร็จ ลองใหม่อีกครั้ง')
    } finally {
      setTranslating(false)
    }
  }

  const cat = getCatConfig(data.category, customCategories)
  const hasCoords = data.lat != null && data.lng != null

  const TABS: { id: TabKey; label: string }[] = [
    { id: 'th',    label: 'ไทย' },
    { id: 'en_zh', label: 'EN / ZH' },
    { id: 'info',  label: 'ข้อมูล' },
  ]

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <IsoPin category={data.category} scale={0.45} />
          <div className="min-w-0">
            <div className="text-white font-bold text-sm truncate">
              {isEdit ? 'แก้ไขสถานที่' : 'เพิ่มสถานที่ใหม่'}
            </div>
            <div className="text-gray-500 text-xs">{cat.label.th}</div>
          </div>
        </div>
        <button type="button" onClick={onClose} className="text-gray-500 hover:text-white p-1 rounded transition-colors text-lg leading-none">×</button>
      </div>

      {/* ── Category selector ── */}
      <div className="px-4 pt-3 pb-2">
        <div className={LABEL}>หมวดหมู่</div>
        <div className="grid grid-cols-5 gap-1">
          {/* built-in */}
          {CATEGORIES.map(c => {
            const cfg = CAT_CONFIG[c]
            const isA = data.category === c
            return (
              <button key={c} type="button" onClick={() => set('category', c)}
                className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all border"
                style={{
                  background:  isA ? `${cfg.color}22` : 'rgba(255,255,255,0.04)',
                  borderColor: isA ? `${cfg.color}66` : 'rgba(255,255,255,0.08)',
                }}>
                <IsoPin category={c} scale={0.35} />
                <span className="text-xs font-semibold" style={{ color: isA ? cfg.color : '#666' }}>
                  {cfg.label.th}
                </span>
              </button>
            )
          })}
          {/* custom categories */}
          {customCategories.map(c => {
            const isA = data.category === c.id
            return (
              <button key={c.id} type="button" onClick={() => set('category', c.id)}
                className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all border"
                style={{
                  background:  isA ? `${c.color}22` : 'rgba(255,255,255,0.04)',
                  borderColor: isA ? `${c.color}66` : 'rgba(255,255,255,0.08)',
                }}>
                <IsoPin category={c.id} catConfig={{ icon: c.icon, color: c.color, label: { th: c.label_th, en: c.label_en ?? c.label_th, zh: c.label_zh ?? c.label_th } }} scale={0.35} />
                <span className="text-xs font-semibold truncate w-full text-center px-0.5" style={{ color: isA ? c.color : '#666' }}>
                  {c.label_th}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Location indicator ── */}
      <div className="px-4 pb-2">
        <div className={LABEL}>ตำแหน่ง {errors.lat && <span className="text-red-400 ml-1">{errors.lat}</span>}</div>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${hasCoords ? 'bg-blue-600/20 border border-blue-500/30 text-blue-300' : 'bg-white/5 border border-white/10 text-gray-500'}`}>
          <span className="text-base">{hasCoords ? '📍' : '🗺️'}</span>
          {hasCoords
            ? <span className="font-mono">{data.lat!.toFixed(6)}, {data.lng!.toFixed(6)}</span>
            : <span>คลิกบนแผนที่ · กด GPS · หรือวาง Google Maps URL</span>}
        </div>
      </div>

      {/* ── Quick fields: price + rating (always visible) ── */}
      <div className="px-4 pb-3 grid grid-cols-2 gap-3">
        <div>
          <div className={LABEL}>ราคา / ค่าเข้า</div>
          <input
            className={INPUT}
            value={data.price_range}
            onChange={e => set('price_range', e.target.value)}
            placeholder="฿100/คน หรือ ฟรี"
          />
        </div>
        <div>
          <div className={LABEL}>
            คะแนน &nbsp;
            <span className="text-yellow-400 font-bold">
              {data.rating > 0 ? `★ ${data.rating}` : '—'}
            </span>
          </div>
          <div className="flex items-center gap-0.5 pt-1">
            {[1, 2, 3, 4, 5].map(star => {
              const filled = star <= Math.round(data.rating)
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => set('rating', data.rating === star ? 0 : star)}
                  className="text-2xl leading-none transition-transform active:scale-90 focus:outline-none select-none"
                  style={{ color: filled ? '#FACC15' : '#4B5563' }}
                >
                  ★
                </button>
              )
            })}
            {data.rating > 0 && (
              <button
                type="button"
                onClick={() => set('rating', 0)}
                className="ml-1 text-xs text-gray-600 hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex px-4 border-b border-white/5 gap-1">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Form fields (scrollable) ── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">

        {/* TAB: ไทย */}
        {tab === 'th' && (
          <>
            <Field label={`ชื่อสถานที่ (ไทย) *  ${errors.name ? `— ${errors.name}` : ''}`}>
              <input
                className={`${INPUT} ${errors.name ? 'border-red-500' : ''}`}
                value={data.name}
                onChange={e => set('name', e.target.value)}
                placeholder="เช่น ปราสาทหินพิมาย"
              />
            </Field>
            <Field label="คำอธิบาย (ไทย)">
              <textarea
                className={INPUT + ' resize-none'}
                rows={3}
                value={data.description}
                onChange={e => set('description', e.target.value)}
                placeholder="รายละเอียดสถานที่..."
              />
            </Field>
            <button
              type="button"
              onClick={() => { setTab('en_zh'); handleAutoTranslate() }}
              disabled={!data.name.trim() || translating}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs
                font-semibold border border-dashed border-purple-500/40 text-purple-400
                hover:bg-purple-500/10 disabled:opacity-40 transition-colors"
            >
              🤖 แปล EN / ZH อัตโนมัติ
            </button>
          </>
        )}

        {/* TAB: EN / ZH */}
        {tab === 'en_zh' && (
          <>
            {/* Auto-translate button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoTranslate}
                disabled={translating}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold
                  bg-purple-500/15 border border-purple-500/30 text-purple-300
                  hover:bg-purple-500/25 disabled:opacity-50 transition-colors"
              >
                {translating ? (
                  <span className="animate-spin">⏳</span>
                ) : (
                  <span>🤖</span>
                )}
                {translating ? 'กำลังแปล…' : 'แปลอัตโนมัติจากภาษาไทย'}
              </button>
              {(data.name_en || data.name_zh) && (
                <span className="text-xs text-green-400">✓ มีข้อมูลแล้ว</span>
              )}
            </div>
            {translateError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {translateError}
              </div>
            )}

            <Field label="Name (English)">
              <input className={INPUT} value={data.name_en} onChange={e => set('name_en', e.target.value)} placeholder="e.g. Phimai Historical Park" />
            </Field>
            <Field label="Description (English)">
              <textarea className={INPUT + ' resize-none'} rows={3} value={data.desc_en} onChange={e => set('desc_en', e.target.value)} placeholder="Place description in English..." />
            </Field>
            <div className="border-t border-white/5 pt-3">
              <Field label="名称（中文）">
                <input className={INPUT} value={data.name_zh} onChange={e => set('name_zh', e.target.value)} placeholder="例如：披迈历史公园" />
              </Field>
              <Field label="描述（中文）">
                <textarea className={INPUT + ' resize-none mt-0'} rows={3} value={data.desc_zh} onChange={e => set('desc_zh', e.target.value)} placeholder="地点描述..." />
              </Field>
            </div>
          </>
        )}

        {/* TAB: ข้อมูลทั่วไป */}
        {tab === 'info' && (
          <>
            <Field label="เบอร์โทรศัพท์">
              <input className={INPUT} type="tel" value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="044-XXXXXX" />
            </Field>
            <Field label="LINE ID">
              <input className={INPUT} value={data.line_id} onChange={e => set('line_id', e.target.value)} placeholder="@yourline" />
            </Field>
            <Field label="URL รูปภาพ">
              <input className={INPUT} type="url" value={data.image_url} onChange={e => set('image_url', e.target.value)} placeholder="https://..." />
            </Field>

            {/* Toggles */}
            <div className="space-y-2 pt-1">
              {([
                { key: 'is_featured' as const, label: '★ Featured', sub: 'แสดงเด่นในรายการ + badge ทอง' },
                { key: 'is_active'   as const, label: '✓ Active',   sub: 'แสดงบนแผนที่สาธารณะ' },
              ] as { key: 'is_featured' | 'is_active'; label: string; sub: string }[]).map(({ key, label, sub }) => (
                <label key={key} className="flex items-center justify-between p-3 rounded-xl bg-white/5 cursor-pointer hover:bg-white/8 transition-colors">
                  <div>
                    <div className="text-sm font-semibold text-white">{label}</div>
                    <div className="text-xs text-gray-500">{sub}</div>
                  </div>
                  <div
                    onClick={() => set(key, !data[key])}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${data[key] ? 'bg-blue-500' : 'bg-white/10'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${data[key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </div>
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Footer actions ── */}
      <div className="px-4 pb-4 pt-2 border-t border-white/5 space-y-2">
        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50"
          style={{ background: cat.color }}
        >
          {saving ? 'กำลังบันทึก...' : isEdit ? '💾 บันทึกการแก้ไข' : '📍 เพิ่มสถานที่'}
        </button>

        {/* Delete */}
        {isEdit && onDelete && !showDeleteConfirm && (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-2 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
          >
            ลบสถานที่นี้
          </button>
        )}
        {isEdit && onDelete && showDeleteConfirm && (
          <div className="flex gap-2">
            <button type="button" onClick={onDelete}
              className="flex-1 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 transition-colors">
              ยืนยันลบ
            </button>
            <button type="button" onClick={() => setShowDeleteConfirm(false)}
              className="flex-1 py-2 rounded-xl text-sm font-semibold text-gray-400 bg-white/5 hover:bg-white/10 transition-colors">
              ยกเลิก
            </button>
          </div>
        )}
      </div>
    </form>
  )
}
