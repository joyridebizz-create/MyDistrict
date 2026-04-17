export function navigate(lat: number, lng: number, _name?: string) {
  const ua = navigator.userAgent
  const isIOS     = /iPad|iPhone|iPod/.test(ua)
  const isAndroid = /Android/.test(ua)

  if (isIOS) {
    window.open(`maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`)
  } else if (isAndroid) {
    window.open(`google.navigation:q=${lat},${lng}&mode=d`)
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`,
      '_blank'
    )
  }
}
