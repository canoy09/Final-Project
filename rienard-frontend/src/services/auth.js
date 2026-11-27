// Talks to the backend. Set VITE_API_URL in .env (e.g. VITE_API_URL=http://localhost:5000)
// Endpoints below are assumptions — match them to your backend teammate's routes.
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const TOKEN_KEY = 'patient_token'

async function request(path, body) {
  let res
  try {
    res = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.')
  return data
}

export function registerPatient(form) {
  return request('/api/patients/register', form)
}

export async function loginPatient({ email, password, remember }) {
  const data = await request('/api/patients/login', { email, password })
  // Remember me -> localStorage (stays after closing browser); otherwise sessionStorage
  const store = remember ? localStorage : sessionStorage
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
  store.setItem(TOKEN_KEY, data.token)
  return data
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
}

export const isLoggedIn = () => Boolean(getToken())

export function logout() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}
