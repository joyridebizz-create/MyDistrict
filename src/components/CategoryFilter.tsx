import { CAT_CONFIG, CATEGORIES } from '../types/place'
import type { Category, Lang } from '../types/place'
import { I18N } from '../types/place'

interface CategoryFilterProps {
  active: Category | 'all'
  lang: Lang
  onChange: (cat: Category | 'all') => void
}

export function CategoryFilter({ active, lang, onChange }: CategoryFilterProps) {
  const t = I18N[lang]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {/* All */}
      <button
        onClick={() => onChange('all')}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
          active === 'all'
            ? 'bg-gray-900 text-white shadow'
            : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
        }`}
      >
        🗺️ {t.all}
      </button>

      {CATEGORIES.map(cat => {
        const cfg   = CAT_CONFIG[cat]
        const isActive = active === cat
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive ? 'text-white shadow' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-400'
            }`}
            style={isActive ? { background: cfg.color } : undefined}
          >
            {cfg.icon} {cfg.label[lang]}
          </button>
        )
      })}
    </div>
  )
}
