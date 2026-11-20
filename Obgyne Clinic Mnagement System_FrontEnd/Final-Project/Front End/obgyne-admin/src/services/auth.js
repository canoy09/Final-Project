// Auth service for the doctor / admin login.
// BACKEND TODO: implement POST {VITE_API_URL}/doctor/login
//   request : { email, password, remember }
//   response: { token, doctor: { id, name, email } }
// Throw an Error with a readable message for invalid credentials.

const API_URL = import.meta.env.VITE_API_URL ?? '/api'
const USE_MOCK = import.meta.env.VITE_MOCK_AUTH === 'true'

// Demo account used only while VITE_MOCK_AUTH=true
const MOCK_DOCTOR = {
  email: 'doctor@moralmacatangay.test',
  password: 'doctor123',
  profile: { id: 1, name: 'Dr. Demo', email: 'doctor@moralmacatangay.test' },
}

export async function loginDoctor({ email, password, remember }) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 700))
    if (email.toLowerCase() === MOCK_DOCTOR.email && password === MOCK_DOCTOR.password) {
      return { token: 'mock-token', doctor: MOCK_DOCTOR.profile }
    }
    throw new Error('Incorrect email or password. Please try again.')
  }

  let res
  try {
    res = await fetch(`${API_URL}/doctor/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, remember }),
    })
  } catch {
    throw new Error('Cannot reach the server. Check your connection and try again.')
  }

  if (res.status === 401 || res.status === 422) {
    throw new Error('Incorrect email or password. Please try again.')
  }
  if (!res.ok) {
    throw new Error('Something went wrong on our side. Please try again later.')
  }
  return res.json()
}
