import type { Lang } from '../types/place'

interface LangToggleProps {
  lang: Lang
  onChange: (lang: Lang) => void
}

const LANGS: { id: Lang; label: string }[] = [
  { id: 'th', label: 'ไทย' },
  { id: 'en', label: 'EN'  },
  { id: 'zh', label: '中'  },
]

export function LangToggle({ lang, onChange }: LangToggleProps) {
  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white shadow-sm">
      {LANGS.map(l => (
        <button
          key={l.id}
          onClick={() => onChange(l.id)}
          className={`px-2.5 py-1 text-xs font-semibold transition-colors ${
            lang === l.id
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
