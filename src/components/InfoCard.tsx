import { useState } from 'react'
import { getCatConfig } from '../types/place'
import { navigate } from '../lib/navigate'
import type { Place, Lang, CustomCategory, SubCategory } from '../types/place'
import { I18N } from '../types/place'

interface InfoCardProps {
  place: Place
  lang: Lang
  customCategories?: CustomCategory[]
  subcategories?:    SubCategory[]
  onClose: () => void
}

export function InfoCard({ place, lang, customCategories = [], subcategories = [], onClose }: InfoCardProps) {
  const t   = I18N[lang]
  const cat = getCatConfig(place.category, customCategories)
  const sub = place.subcategory
    ? subcategories.find(s => s.id === place.subcategory)
    : null
  const subLabel = sub
    ? ((lang === 'en' ? sub.label_en : lang === 'zh' ? sub.label_zh : null) ?? sub.label_th)
    : null

  const name = (lang === 'en' ? place.name_en : lang === 'zh' ? place.name_zh : null) ?? place.name
  const desc = (lang === 'en' ? place.desc_en  : lang === 'zh' ? place.desc_zh  : null) ?? place.description

  /** รวม image_url + images array เพื่อแสดง thumbnail strip */
  const allImages: string[] = [
    ...(place.image_url ? [place.image_url] : []),
    ...(place.images ?? []),
  ].filter(Boolean).slice(0, 5)

  const hasGallery = allImages.length > 1
  const [activeIdx, setActiveIdx] = useState(0)

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 flex justify-center pb-4 px-4 pointer-events-none">
      <div
        className="bg-[#1a1d2b] rounded-2xl shadow-2xl max-w-sm w-full pointer-events-auto overflow-hidden"
        style={{ boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07)` }}
      >
        {/* ── Hero Image ── */}
        {allImages.length > 0 ? (
          <div className="relative h-40 overflow-hidden">
            <img
              src={allImages[activeIdx]}
              alt={name}
              className="w-full h-full object-cover transition-all duration-300"
              onError={e => { (e.currentTarget as HTMLImageElement).src = '' }}
            />
            {/* gradient overlay bottom */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#1a1d2b] to-transparent" />
            {/* gradient overlay top */}
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/40 to-transparent" />

            {/* category color accent bar */}
            <div className="absolute top-0 inset-x-0 h-0.5" style={{ background: cat.color }} />

            {/* Featured badge */}
            {place.is_featured && (
              <span className="absolute top-2.5 left-3 text-xs bg-yellow-500/90 text-black px-2 py-0.5 rounded-full font-bold backdrop-blur-sm">
                ★ {t.featured}
              </span>
            )}

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors backdrop-blur-sm text-xs"
            >
              ✕
            </button>

            {/* Image counter badge */}
            {allImages.length > 1 && (
              <span className="absolute bottom-2.5 right-3 text-xs text-white/70 bg-black/40 px-1.5 py-0.5 rounded-full backdrop-blur-sm">
                {activeIdx + 1}/{allImages.length}
              </span>
            )}
          </div>
        ) : (
          /* No image — compact header bar */
          <div
            className="h-1.5 w-full"
            style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.color}60)` }}
          />
        )}

        {/* ── Thumbnail Strip (horizontal) ── */}
        {allImages.length > 1 && (
          <div className="flex gap-1.5 px-3 pt-2.5">
            {allImages.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveIdx(i)}
                className="relative flex-none w-12 h-9 rounded-lg overflow-hidden transition-all duration-200"
                style={{
                  outline: activeIdx === i ? `2px solid ${cat.color}` : '2px solid transparent',
                  outlineOffset: 1,
                  opacity: activeIdx === i ? 1 : 0.55,
                }}
              >
                <img
                  src={url}
                  alt={`photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* ── Content ── */}
        <div className="px-3 pt-2.5 pb-3">
          {/* Badges row */}
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            {/* Category icon + label */}
            <span
              className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: `${cat.color}22`, color: cat.color }}
            >
              <span className="text-sm leading-none">{cat.icon}</span>
              {cat.label[lang]}
            </span>
            {subLabel && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium border"
                style={{ borderColor: `${cat.color}35`, color: `${cat.color}BB`, background: `${cat.color}0F` }}
              >
                {subLabel}
              </span>
            )}
            {!place.is_featured && place.rating >= 4.5 && (
              <span className="text-xs bg-yellow-500/15 text-yellow-400 px-2 py-0.5 rounded-full">
                ★ Top
              </span>
            )}
          </div>

          {/* No image → show icon inline */}
          <div className={`flex items-start gap-2.5 ${allImages.length === 0 ? '' : ''}`}>
            {allImages.length === 0 && (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 mt-0.5"
                style={{ background: `${cat.color}18` }}
              >
                {cat.icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-base leading-tight line-clamp-1">{name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {place.rating > 0 && (
                  <span className="text-xs text-amber-400 font-semibold">★ {place.rating.toFixed(1)}</span>
                )}
                {place.price_range && (
                  <span className="text-xs text-gray-400 font-medium">{place.price_range}</span>
                )}
              </div>
            </div>
            {/* Close button when no hero image */}
            {allImages.length === 0 && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Description */}
          {desc && (
            <p className="mt-1.5 text-xs text-gray-400 leading-relaxed line-clamp-2">{desc}</p>
          )}

          {/* Actions */}
          <div className="mt-2.5 flex gap-2">
            <button
              onClick={() => navigate(place.lat, place.lng, name)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
              style={{ background: cat.color }}
            >
              📍 {t.navigate}
            </button>
            {place.phone && (
              <a
                href={`tel:${place.phone}`}
                className="w-11 flex items-center justify-center rounded-xl text-lg bg-white/8 hover:bg-white/15 transition-colors border border-white/10"
              >
                📞
              </a>
            )}
            {place.line_id && (
              <a
                href={`https://line.me/ti/p/${place.line_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2.5 rounded-xl text-xs font-bold bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors border border-green-500/20"
              >
                LINE
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
