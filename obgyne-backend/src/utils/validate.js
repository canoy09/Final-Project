// Reusable input validation helpers for the backend. No packages needed.
// Every parse* function returns a result object instead of throwing, so a
// controller can answer with a clean 400 message:
//
//   const q = parseSearch(req.query.search)
//   if (q.error) return res.status(400).json({ message: q.error })

const PATIENT_CODE_RE = /^P-\d{4,8}$/i
const SEARCH_MAX_LENGTH = 60
// letters (any language), numbers, space, period, comma, apostrophe, hyphen
const SEARCH_ALLOWED_RE = /^[\p{L}\p{M}0-9 .,'’-]+$/u

// A real calendar date written as YYYY-MM-DD (rejects 2026-02-30 etc.)
function isValidISODate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

// Patient identifier from a URL: either the numeric id ("12") or the clinic
// patient code ("P-0012"). -> { type: 'id'|'code', value } or null if invalid.
function parsePatientRef(raw) {
  if (typeof raw !== 'string') return null
  const s = raw.trim()
  if (/^\d{1,9}$/.test(s) && Number(s) > 0) return { type: 'id', value: Number(s) }
  if (PATIENT_CODE_RE.test(s)) return { type: 'code', value: s.toUpperCase() }
  return null
}

// Search text typed by the admin. Optional: undefined/blank means "no search".
// -> { value } or { error }
function parseSearch(raw) {
  if (raw === undefined) return { value: '' }
  if (typeof raw !== 'string') return { error: 'Search must be text.' }
  const value = raw.trim().replace(/\s+/g, ' ')
  if (value.length > SEARCH_MAX_LENGTH) {
    return { error: `Search must be ${SEARCH_MAX_LENGTH} characters or fewer.` }
  }
  if (value && !SEARCH_ALLOWED_RE.test(value)) {
    return { error: "Search can only contain letters, numbers, spaces and . , ' -" }
  }
  return { value }
}

// Whole number inside a range, from a query string. -> { value } or { error }
function parseIntInRange(raw, { name, min, max, fallback }) {
  if (raw === undefined || raw === '') return { value: fallback }
  if (typeof raw !== 'string' || !/^\d{1,9}$/.test(raw)) {
    return { error: `${name} must be a whole number.` }
  }
  const n = Number(raw)
  if (n < min || n > max) return { error: `${name} must be between ${min} and ${max}.` }
  return { value: n }
}

// Makes text safe to use inside a SQL LIKE pattern (% and _ lose their meaning).
function escapeLike(text) {
  return text.replace(/[\\%_]/g, '\\$&')
}

module.exports = {
  isValidISODate,
  parsePatientRef,
  parseSearch,
  parseIntInRange,
  escapeLike,
  SEARCH_MAX_LENGTH,
}
