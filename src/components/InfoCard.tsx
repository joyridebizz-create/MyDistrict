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

  return (
    <div className="absolute inset-x-0 bottom-0 z-50 flex justify-center pb-4 px-4 pointer-events-none">
      <div
        className="bg-[#1a1d2b] rounded-2xl shadow-2xl max-w-sm w-full pointer-events-auto border border-white/10"
        style={{ borderTop: `3px solid ${cat.color}` }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: `${cat.color}20` }}
          >
            {place.image_url
              ? <img src={place.image_url} alt={name} className="w-full h-full rounded-xl object-cover" />
              : cat.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${cat.color}25`, color: cat.color }}
              >
                {cat.label[lang]}
              </span>
              {subLabel && (
                <span className="text-xs px-2 py-0.5 rounded-full border font-medium"
                  style={{ borderColor: `${cat.color}40`, color: `${cat.color}CC`, background: `${cat.color}10` }}>
                  {subLabel}
                </span>
              )}
              {place.is_featured && (
                <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-semibold">
                  ★ {t.featured}
                </span>
              )}
            </div>
            <h3 className="font-bold text-white text-base leading-snug">{name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {place.rating > 0 && (
                <span className="text-xs text-amber-400 font-semibold">★ {place.rating.toFixed(1)}</span>
              )}
              {place.price_range && (
                <span className="text-xs text-gray-400">{place.price_range}</span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 text-sm"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        {desc && (
          <p className="px-4 pb-3 text-sm text-gray-400 leading-relaxed">{desc}</p>
        )}

        {/* Actions */}
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => navigate(place.lat, place.lng, name)}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-colors"
            style={{ background: cat.color }}
          >
            📍 {t.navigate}
          </button>
          {place.phone && (
            <a
              href={`tel:${place.phone}`}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-white/10 text-gray-200 hover:bg-white/20 transition-colors"
            >
              📞
            </a>
          )}
          {place.line_id && (
            <a
              href={`https://line.me/ti/p/${place.line_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
            >
              LINE
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
