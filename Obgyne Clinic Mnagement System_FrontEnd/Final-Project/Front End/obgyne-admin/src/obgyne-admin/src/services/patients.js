// Patient records service for 1.3.1 View patient health records.
//
//   GET {VITE_API_URL}/patients?search=&page=&limit=   -> { patients, total, page, limit }
//   GET {VITE_API_URL}/patients/:id                    -> { patient, medicalHistory, checkups }
//   Header: Authorization: Bearer <token>   (doctor accounts only)

const API_URL = import.meta.env.VITE_API_URL

export class RecordsError extends Error {
  // code: 'unauthorized' | 'forbidden' | 'not_found' | 'invalid' | 'network' | 'config' | 'server'
  constructor(message, code = 'server') {
    super(message)
    this.code = code
  }
}

async function request(path, token, { method = 'GET', body } = {}) {
  if (!API_URL) {
    throw new RecordsError('VITE_API_URL is not set. Add it to .env and restart the dev server.', 'config')
  }
  let res
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new RecordsError('Cannot reach the server. Check your connection and try again.', 'network')
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) {
    throw new RecordsError(data.message || 'Your session expired. Please log in again.', 'unauthorized')
  }
  if (res.status === 403) {
    throw new RecordsError(data.message || 'You do not have permission to view patient records.', 'forbidden')
  }
  if (res.status === 404) throw new RecordsError(data.message || 'Patient record not found.', 'not_found')
  if (res.status === 400) throw new RecordsError(data.message || 'That request was not valid.', 'invalid')
  if (!res.ok) throw new RecordsError(data.message || 'Could not process patient records. Please try again.', 'server')
  return data
}

export function fetchPatients({ search = '', page = 1, limit = 10, token }) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (search) params.set('search', search)
  return request(`/patients?${params}`, token)
}

export function fetchPatientRecord({ id, token }) {
  return request(`/patients/${encodeURIComponent(id)}`, token)
}

// PUT /api/patients/:id - WBS 1.3.2 update personal details and medical history.
export function updatePatientRecord({ id, token, patient, medicalHistory }) {
  return request(`/patients/${encodeURIComponent(id)}`, token, {
    method: 'PUT',
    body: { patient, medicalHistory },
  })
}
