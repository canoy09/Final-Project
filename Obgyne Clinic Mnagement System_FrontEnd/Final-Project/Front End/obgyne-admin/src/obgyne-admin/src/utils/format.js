// Small display helpers shared by the pages.

// "2026-11-12" -> "Nov 12, 2026"   (empty -> "—")
export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// null / undefined / blank text -> "—"
export function valueOrDash(value) {
  return value === null || value === undefined || String(value).trim() === '' ? '—' : value
}

// "Dr. Moral-Macatangay" -> "MM", "Clinic Secretary" -> "CS"
export function initials(name) {
  return String(name || '')
    .replace(/^(dr|dra|mr|ms|mrs)\.?\s+/i, '')
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}
