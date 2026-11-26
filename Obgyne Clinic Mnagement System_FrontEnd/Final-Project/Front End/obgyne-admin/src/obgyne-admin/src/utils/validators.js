// Reusable form / input validation helpers.
// Each validate* function returns an error message, or '' when the value is fine,
// so a page can do:   const error = validateSearch(text)   ->   {error && <p>{error}</p>}
// The rules match the backend (src/utils/validate.js) so users see the problem
// before the request is even sent.

export const SEARCH_MAX_LENGTH = 60
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// letters (any language), numbers, space, period, comma, apostrophe, hyphen
const SEARCH_ALLOWED_RE = /^[\p{L}\p{M}0-9 .,'’-]+$/u
const PATIENT_CODE_RE = /^P-\d{4,8}$/i

export function isRequired(value) {
  return typeof value === 'string' && value.trim() !== ''
}

export function isEmail(value) {
  return typeof value === 'string' && EMAIL_RE.test(value.trim())
}

export function isPatientCode(value) {
  return typeof value === 'string' && PATIENT_CODE_RE.test(value.trim())
}

// Trim and collapse repeated spaces: "  maria   santos " -> "maria santos"
export function normalizeSearch(value) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''
}

// Patient search box: empty is allowed (shows everyone).
export function validateSearch(value) {
  const text = normalizeSearch(value)
  if (text.length > SEARCH_MAX_LENGTH) {
    return `Search must be ${SEARCH_MAX_LENGTH} characters or fewer.`
  }
  if (text && !SEARCH_ALLOWED_RE.test(text)) {
    return "Search can only contain letters, numbers, spaces and . , ' -"
  }
  return ''
}
