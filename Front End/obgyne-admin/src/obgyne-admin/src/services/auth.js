// Auth service for Admin Log In (roles: doctor, secretary).
// Requires VITE_API_URL in .env, e.g. VITE_API_URL=http://localhost:3000

const API_URL = import.meta.env.VITE_API_URL
const SESSION_KEY = 'obgyne_admin_session'

export const ROLES = {
  doctor: { value: 'doctor', label: 'Doctor' },
  secretary: { value: 'secretary', label: 'Secretary' },
}

// Kept so AdminLogin.jsx imports don't break. Demo mode is permanently off.
export const DEMO_MODE = false
export const DEMO_ACCOUNTS = []

export class AuthError extends Error {
  constructor(message, { code = 'invalid', retryAfter = 0 } = {}) {
    super(message)
    this.code = code
    this.retryAfter = retryAfter
  }
}

async function apiLogin(payload) {
  if (!API_URL) {
    throw new AuthError('VITE_API_URL is not set. Add it to .env and restart the dev server.', { code: 'config' })
  }
  let res
  try {
    res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new AuthError('Cannot reach the server. Check your connection and try again.', { code: 'network' })
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 429) {
    throw new AuthError(data.message || 'Too many failed attempts. Please try again later.', {
      code: 'locked',
      retryAfter: data.retryAfter || 0,
    })
  }
  if (!res.ok) throw new AuthError(data.message || 'Incorrect email or password for the selected role.')
  return data
}

export async function login({ identifier, password, role, remember }) {
  const payload = { identifier: identifier.trim(), password, role }
  const { token, user } = await apiLogin(payload)
  const session = { token, user }
  const store = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  try {
    other.removeItem(SESSION_KEY)
    store.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // storage blocked: session lasts only for this page load
  }
  return session
}

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function logout() {
  const session = getSession()
  try {
    sessionStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
  if (session?.token && API_URL) {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.token}` },
      })
    } catch {
      // local session is already cleared
    }
  }
}