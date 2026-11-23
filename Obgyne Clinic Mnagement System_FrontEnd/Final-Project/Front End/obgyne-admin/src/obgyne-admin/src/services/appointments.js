// Appointment service for 1.2.1 View clinic appointment schedule.
//
// Expected backend (to be built for 1.2.1):
//   GET {VITE_API_URL}/appointments?date=YYYY-MM-DD&status=pending|approved|rejected|completed
//   Header: Authorization: Bearer <token>
//   -> 200 { appointments: [ { id, date, time: "HH:MM", patientName, status, type, contact, notes } ] }
//   -> 401 when the token is missing/expired
//
// While that endpoint does not exist yet (404) or there is no API at all,
// the page falls back to SAMPLE data so the front end can be shown and tested.

const API_URL = import.meta.env.VITE_API_URL

export const STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
}

export class ScheduleError extends Error {
  constructor(message, code = 'server') {
    super(message)
    this.code = code
  }
}

// ---- Date helpers (all local time, "YYYY-MM-DD" strings) -------------------
export function toISODate(d) {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

export function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return toISODate(d)
}

export function formatDateLong(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

// ---- Sample data (dates are relative to today so there is always something to see)
function getSample() {
  const today = toISODate(new Date())
  const d = (n) => addDays(today, n)
  return [
    { id: 1, date: d(-1), time: '09:00', patientName: 'Maria Santos', status: 'completed', type: 'Prenatal check-up', contact: '0917 000 0101', notes: '28 weeks. Routine monitoring.' },
    { id: 2, date: d(-1), time: '10:30', patientName: 'Angelica Reyes', status: 'completed', type: 'Pap smear', contact: '0917 000 0102', notes: '' },
    { id: 3, date: d(0), time: '08:30', patientName: 'Joanna Dela Cruz', status: 'approved', type: 'Prenatal check-up', contact: '0917 000 0103', notes: '32 weeks. Bring previous lab results.' },
    { id: 4, date: d(0), time: '09:30', patientName: 'Katrina Villanueva', status: 'approved', type: 'Ultrasound', contact: '0917 000 0104', notes: 'Fetal growth scan.' },
    { id: 5, date: d(0), time: '11:00', patientName: 'Rhea Mendoza', status: 'pending', type: 'Family planning consultation', contact: '0917 000 0105', notes: 'First visit.' },
    { id: 6, date: d(0), time: '13:30', patientName: 'Liza Bautista', status: 'rejected', type: 'Follow-up check-up', contact: '0917 000 0106', notes: 'Requested time already taken.' },
    { id: 7, date: d(0), time: '15:00', patientName: 'Carla Aquino', status: 'pending', type: 'Post-partum check-up', contact: '0917 000 0107', notes: '' },
    { id: 8, date: d(1), time: '09:00', patientName: 'Patricia Ramos', status: 'approved', type: 'Prenatal check-up', contact: '0917 000 0108', notes: '20 weeks.' },
    { id: 9, date: d(1), time: '10:00', patientName: 'Elena Garcia', status: 'pending', type: 'Pap smear', contact: '0917 000 0109', notes: '' },
    { id: 10, date: d(2), time: '14:00', patientName: 'Sofia Navarro', status: 'pending', type: 'Follow-up check-up', contact: '0917 000 0110', notes: 'Follow-up of last month visit.' },
  ]
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const byTime = (a, b) => a.time.localeCompare(b.time)

// ---- Main function used by the page ----------------------------------------
// Returns { appointments, sample } where `sample` is true when demo data was used.
export async function fetchAppointments({ date, status, token }) {
  if (API_URL) {
    try {
      const params = new URLSearchParams({ date })
      if (status && status !== 'all') params.set('status', status)
      const res = await fetch(`${API_URL}/appointments?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) throw new ScheduleError('Your session expired. Please log in again.', 'unauthorized')
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.appointments || []
        return { appointments: [...list].sort(byTime), sample: false }
      }
      if (res.status !== 404) throw new ScheduleError('Could not load the schedule. Please try again.')
      // 404: the schedule endpoint is not built yet -> use sample data below
    } catch (err) {
      if (err instanceof ScheduleError) throw err
      // network problem: fall through to sample data
    }
  }

  await wait(500) // lets you see the loading state
  const appointments = getSample()
    .filter((a) => a.date === date && (status === 'all' || a.status === status))
    .sort(byTime)
  return { appointments, sample: true }
}
