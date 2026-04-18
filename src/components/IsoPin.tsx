import type { Category, CatConfig } from '../types/place'

interface IsoPinProps {
  category:   string
  catConfig?: CatConfig        // config ของ custom category (ถ้ามี)
  /** แทนที่ SVG หมวดหลักด้วยรูป (จาก nodes.iso_pin_icons) */
  isoOverrideUrl?: string | null
  featured?:  boolean
  selected?:  boolean
  scale?:     number
  onClick?:   () => void
}

/* ──────────────────────────────────────────────────────────
   ISO-style building SVGs per category
   All viewBox="0 0 64 80" — anchor at bottom-centre
   ────────────────────────────────────────────────────────── */

function TourSvg() {
  return (
    // ปราสาทหิน 3 ชั้น สีน้ำตาลทอง
    <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="32" cy="76" rx="18" ry="4" fill="rgba(0,0,0,0.18)" />
      {/* Base platform */}
      <path d="M8 60 L32 50 L56 60 L32 70 Z" fill="#B8860B" />
      {/* Middle tier */}
      <path d="M14 52 L32 43 L50 52 L32 61 Z" fill="#C9963A" />
      {/* Upper tier */}
      <path d="M20 44 L32 36 L44 44 L32 52 Z" fill="#DAA520" />
      {/* Spire */}
      <polygon points="32,16 28,36 36,36" fill="#B8860B" />
      <polygon points="32,12 30,22 34,22" fill="#FFD700" />
      {/* Left face base */}
      <path d="M8 60 L8 66 L32 76 L32 70 Z" fill="#8B6914" />
      {/* Right face base */}
      <path d="M56 60 L56 66 L32 76 L32 70 Z" fill="#A0780C" />
      {/* Window decorations */}
      <rect x="28" y="38" width="4" height="5" rx="2" fill="#5A3800" opacity="0.7" />
      <rect x="22" y="46" width="3" height="4" rx="1.5" fill="#5A3800" opacity="0.6" />
      <rect x="39" y="46" width="3" height="4" rx="1.5" fill="#5A3800" opacity="0.6" />
    </svg>
  )
}

function StaySvg() {
  return (
    // อาคารสูง สีน้ำเงิน มีไฟ
    <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="76" rx="18" ry="4" fill="rgba(0,0,0,0.18)" />
      {/* Building front */}
      <rect x="18" y="20" width="28" height="52" rx="1" fill="#4A9EEB" />
      {/* Roof */}
      <rect x="16" y="16" width="32" height="6" rx="1" fill="#2E7DC5" />
      {/* Rooftop structure */}
      <rect x="26" y="8" width="12" height="10" rx="1" fill="#2E7DC5" />
      <rect x="30" y="4" width="4" height="6" fill="#1A5FA0" />
      {/* Windows grid */}
      {[28, 36, 44, 52, 60].map((y, i) => (
        <g key={i}>
          <rect x="22" y={y} width="5" height="4" rx="0.5"
            fill={i % 2 === 0 ? '#FFE066' : '#B3D9FF'} opacity="0.9" />
          <rect x="30" y={y} width="5" height="4" rx="0.5"
            fill={i % 3 === 0 ? '#FFE066' : '#B3D9FF'} opacity="0.9" />
          <rect x="38" y={y} width="5" height="4" rx="0.5"
            fill={i % 2 === 1 ? '#FFE066' : '#B3D9FF'} opacity="0.9" />
        </g>
      ))}
      {/* Side face */}
      <path d="M46 20 L58 26 L58 72 L46 72 Z" fill="#2E7DC5" />
      {/* Side windows */}
      {[28, 36, 44, 52, 60].map((y, i) => (
        <rect key={i} x="49" y={y} width="5" height="4" rx="0.5"
          fill={i % 2 === 0 ? '#FFE066' : '#7BC0F0'} opacity="0.8" />
      ))}
      {/* Ground floor entrance */}
      <rect x="26" y="60" width="12" height="12" rx="1" fill="#1A5FA0" />
      <rect x="29" y="62" width="3" height="10" rx="0.5" fill="#0D3A6B" />
      <rect x="32" y="62" width="3" height="10" rx="0.5" fill="#0D3A6B" />
    </svg>
  )
}

function FoodSvg() {
  return (
    // ร้านมีกันสาด สีส้ม-แดง
    <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="76" rx="18" ry="4" fill="rgba(0,0,0,0.18)" />
      {/* Building */}
      <rect x="12" y="32" width="40" height="40" rx="1" fill="#FF6B4A" />
      {/* Roof */}
      <path d="M8 32 L32 18 L56 32 Z" fill="#CC3D1E" />
      {/* Awning */}
      <path d="M8 38 L56 38 L52 46 L12 46 Z" fill="#FFD700" />
      {/* Awning stripes */}
      {[14, 22, 30, 38, 46].map(x => (
        <line key={x} x1={x} y1="38" x2={x - 2} y2="46" stroke="#FF6B4A" strokeWidth="2" />
      ))}
      {/* Windows */}
      <rect x="16" y="50" width="10" height="10" rx="1" fill="#FFE4D6" opacity="0.9" />
      <rect x="38" y="50" width="10" height="10" rx="1" fill="#FFE4D6" opacity="0.9" />
      {/* Door */}
      <rect x="26" y="56" width="12" height="16" rx="1" fill="#CC3D1E" />
      <circle cx="33" cy="64" r="1.5" fill="#FFD700" />
      {/* Sign */}
      <rect x="22" y="34" width="20" height="5" rx="1" fill="#FFD700" />
      <rect x="24" y="35" width="16" height="3" rx="0.5" fill="#CC3D1E" opacity="0.5" />
      {/* Side */}
      <path d="M52 32 L60 38 L60 72 L52 72 Z" fill="#CC3D1E" />
    </svg>
  )
}

function CafeSvg() {
  return (
    // บ้านหลังคาสองชั้น สีน้ำตาล
    <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="76" rx="18" ry="4" fill="rgba(0,0,0,0.18)" />
      {/* Main building */}
      <rect x="12" y="38" width="38" height="34" rx="1" fill="#C47840" />
      {/* Main roof */}
      <path d="M8 38 L32 20 L56 38 Z" fill="#8B4513" />
      {/* Chimney */}
      <rect x="38" y="14" width="6" height="14" rx="1" fill="#6B3410" />
      {/* Smoke dots */}
      <circle cx="41" cy="10" r="2" fill="#D3D3D3" opacity="0.6" />
      <circle cx="43" cy="6"  r="1.5" fill="#D3D3D3" opacity="0.4" />
      {/* Lower roof overhang */}
      <path d="M10 38 L54 38 L52 42 L12 42 Z" fill="#6B3410" />
      {/* Second floor window */}
      <rect x="26" y="40" width="12" height="8" rx="1" fill="#FFE4B5" opacity="0.9" />
      <line x1="32" y1="40" x2="32" y2="48" stroke="#C47840" strokeWidth="1" />
      <line x1="26" y1="44" x2="38" y2="44" stroke="#C47840" strokeWidth="1" />
      {/* Ground floor windows */}
      <rect x="14" y="52" width="10" height="8" rx="1" fill="#FFE4B5" opacity="0.9" />
      <rect x="40" y="52" width="10" height="8" rx="1" fill="#FFE4B5" opacity="0.9" />
      {/* Door */}
      <rect x="25" y="58" width="14" height="14" rx="1" fill="#6B3410" />
      <circle cx="32" cy="66" r="1.5" fill="#FFD700" />
      {/* Coffee cup sign */}
      <circle cx="32" cy="30" r="4" fill="#FFD700" />
      <text x="32" y="33" textAnchor="middle" fontSize="6" fill="#6B3410">☕</text>
      {/* Side */}
      <path d="M50 38 L58 44 L58 72 L50 72 Z" fill="#8B4513" />
    </svg>
  )
}

function CarSvg() {
  return (
    // โรงรถสีเขียว มีรถจอด
    <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="76" rx="18" ry="4" fill="rgba(0,0,0,0.18)" />
      {/* Building */}
      <rect x="10" y="36" width="44" height="36" rx="1" fill="#60C860" />
      {/* Flat roof */}
      <rect x="8" y="30" width="48" height="8" rx="1" fill="#3A8A3A" />
      {/* Roof sign bar */}
      <rect x="16" y="22" width="32" height="10" rx="2" fill="#2D6E2D" />
      <rect x="18" y="24" width="28" height="6" rx="1" fill="#60C860" opacity="0.5" />
      {/* Garage doors */}
      <rect x="12" y="48" width="18" height="20" rx="1" fill="#2D6E2D" />
      <rect x="34" y="48" width="18" height="20" rx="1" fill="#2D6E2D" />
      {/* Door lines */}
      {[52, 56, 60].map(y => (
        <g key={y}>
          <line x1="12" y1={y} x2="30" y2={y} stroke="#60C860" strokeWidth="0.8" opacity="0.6" />
          <line x1="34" y1={y} x2="52" y2={y} stroke="#60C860" strokeWidth="0.8" opacity="0.6" />
        </g>
      ))}
      {/* Car silhouette */}
      <path d="M16 46 Q20 40 28 40 Q32 40 34 46 Z" fill="#FFD700" opacity="0.7" />
      <rect x="15" y="44" width="20" height="4" rx="2" fill="#FFD700" opacity="0.7" />
      {/* Wheels */}
      <circle cx="19" cy="48" r="2" fill="#333" opacity="0.6" />
      <circle cx="31" cy="48" r="2" fill="#333" opacity="0.6" />
      {/* Windows on building */}
      <rect x="12" y="38" width="8" height="6" rx="0.5" fill="#A8DDA8" opacity="0.8" />
      <rect x="44" y="38" width="8" height="6" rx="0.5" fill="#A8DDA8" opacity="0.8" />
      {/* Side */}
      <path d="M54 36 L60 40 L60 72 L54 72 Z" fill="#3A8A3A" />
    </svg>
  )
}

const SVG_MAP: Record<Category, () => JSX.Element> = {
  tour: TourSvg,
  stay: StaySvg,
  food: FoodSvg,
  cafe: CafeSvg,
  car:  CarSvg,
}

function EmojiPin({ icon, color }: { icon: string; color: string }) {
  return (
    <svg viewBox="0 0 64 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="32" cy="76" rx="16" ry="4" fill="rgba(0,0,0,0.18)" />
      {/* pin body */}
      <path
        d="M32 6 C19 6 10 17 10 28 C10 46 32 74 32 74 C32 74 54 46 54 28 C54 17 45 6 32 6 Z"
        fill={color}
      />
      <circle cx="32" cy="28" r="13" fill="white" opacity="0.92" />
      <text x="32" y="33" textAnchor="middle" fontSize="15" fontFamily="system-ui, sans-serif">
        {icon}
      </text>
    </svg>
  )
}

/** แสดงภาพ custom building ที่ admin อัพโหลด — เต็มพื้นที่ pin */
function CustomImagePin({ url, color }: { url: string; color: string }) {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* shadow ellipse */}
      <div style={{
        position: 'absolute',
        bottom: '1%',
        left: '12%', right: '12%',
        height: '7%',
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.18)',
        filter: 'blur(2px)',
      }} />
      {/* building image */}
      <img
        src={url}
        alt=""
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          bottom: '8%',
          width: '100%',
          height: '92%',
          objectFit: 'contain',
          filter: `drop-shadow(0 3px 6px rgba(0,0,0,0.4))`,
        }}
        onError={e => {
          // fallback: ซ่อนรูปถ้าโหลดไม่ได้
          ;(e.currentTarget as HTMLImageElement).style.opacity = '0'
        }}
      />
      {/* color accent bar ด้านล่างอาคาร */}
      <div style={{
        position: 'absolute',
        bottom: '7%',
        left: '20%', right: '20%',
        height: 2,
        borderRadius: 1,
        background: color,
        opacity: 0.7,
      }} />
    </div>
  )
}

export function IsoPin({
  category,
  catConfig,
  isoOverrideUrl,
  featured = false,
  selected = false,
  scale = 1,
  onClick,
}: IsoPinProps) {
  const builtIn = SVG_MAP[category as Category]
  const SvgComponent = builtIn ?? null
  const color = catConfig?.color ?? '#6366F1'
  const override = isoOverrideUrl?.trim()

  let pinBody: JSX.Element
  if (override) {
    pinBody = <CustomImagePin url={override} color={color} />
  } else if (SvgComponent) {
    pinBody = <SvgComponent />
  } else if (catConfig?.icon_url) {
    pinBody = <CustomImagePin url={catConfig.icon_url} color={color} />
  } else {
    pinBody = (
      <EmojiPin
        icon={catConfig?.icon ?? '📍'}
        color={color}
      />
    )
  }

  return (
    <div
      className="iso-pin"
      onClick={onClick}
      style={{
        width: 64 * scale,
        height: 80 * scale,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        animation: 'pinBob 3s ease-in-out infinite',
        filter: selected
          ? 'drop-shadow(0 0 10px #60a5fa) drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
          : featured
            ? 'drop-shadow(0 0 8px gold) drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
            : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))',
        transformOrigin: 'bottom center',
      }}
    >
      {pinBody}
      {featured && (
        <div
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            width: 14 * scale,
            height: 14 * scale,
            borderRadius: '50%',
            background: 'gold',
            border: '2px solid white',
            fontSize: 8 * scale,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ★
        </div>
      )}
    </div>
  )
}
