import { CAT_CONFIG } from '../types/place'
import { navigate } from '../lib/navigate'
import type { Place, Lang } from '../types/place'
import { I18N } from '../types/place'

interface PlaceCardProps {
  place: Place
  lang: Lang
  onClick?: () => void
}

export function PlaceCard({ place, lang, onClick }: PlaceCardProps) {
  const t   = I18N[lang]
  const cat = CAT_CONFIG[place.category]
  const name = (lang === 'en' ? place.name_en : lang === 'zh' ? place.name_zh : null) ?? place.name
  const desc = (lang === 'en' ? place.desc_en  : lang === 'zh' ? place.desc_zh  : null) ?? place.description

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Image / icon area */}
      <div
        className="h-32 flex items-center justify-center relative overflow-hidden"
        style={{ background: `${cat.color}15` }}
      >
        {place.image_url ? (
          <img src={place.image_url} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-5xl">{cat.icon}</span>
        )}
        {place.is_featured && (
          <div className="absolute top-2 right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow">
            ★ Featured
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">{name}</h3>
          {place.rating > 0 && (
            <span className="text-amber-500 text-xs font-bold flex-shrink-0">★ {place.rating.toFixed(1)}</span>
          )}
        </div>

        {desc && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{desc}</p>
        )}

        <div className="flex items-center justify-between">
          {place.price_range ? (
            <span className="text-xs text-gray-500">{place.price_range}</span>
          ) : (
            <span className="text-xs text-green-600 font-medium">{t.free}</span>
          )}

          <button
            onClick={e => { e.stopPropagation(); navigate(place.lat, place.lng, name) }}
            className="text-xs font-medium px-2 py-1 rounded-lg text-white transition-colors"
            style={{ background: cat.color }}
          >
            📍 {t.navigate}
          </button>
        </div>
      </div>
    </div>
  )
}
