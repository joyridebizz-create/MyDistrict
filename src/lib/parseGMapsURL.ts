/**
 * Parse a Google Maps URL into { lat, lng }.
 * Supports all common URL formats:
 *   ?q=lat,lng          → https://maps.google.com/?q=15.22,102.49
 *   @lat,lng            → https://www.google.com/maps/@15.22,102.49,15z
 *   !3d{lat}!4d{lng}    → https://goo.gl/maps/xxxx!3d15.22!4d102.49
 */
export function parseGMapsURL(url: string): { lat: number; lng: number } | null {
  // Pattern 1: ?q=lat,lng  or &q=lat,lng
  let m = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/)

  // Pattern 2: @lat,lng,zoom
  if (!m) m = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/)

  // Pattern 3: !3d{lat}!4d{lng}
  if (!m) m = url.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/)

  if (!m) return null

  const lat = parseFloat(m[1]!)
  const lng = parseFloat(m[2]!)

  if (isNaN(lat) || isNaN(lng)) return null
  if (lat < -90 || lat > 90)   return null
  if (lng < -180 || lng > 180) return null

  return { lat, lng }
}
