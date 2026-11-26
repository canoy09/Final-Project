import { useEffect, useState } from 'react'
import AppHeader from '../components/AppHeader'
import {
  fetchAppointments,
  STATUS_LABELS,
  toISODate,
  addDays,
  formatDateLong,
  formatTime,
} from '../services/appointments'
import './Schedule.css'

const FILTERS = ['all', 'pending', 'approved', 'rejected', 'completed']

export default function Schedule({ session, onLogout }) {
  const { user, token } = session
  const [today] = useState(() => toISODate(new Date()))
  const [date, setDate] = useState(today)
  const [status, setStatus] = useState('all')
  const [reload, setReload] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [result, setResult] = useState({ key: '', appointments: [], sample: false, error: '' })

  // Every change of day / filter / retry makes a new request key
  const requestKey = `${date}|${status}|${reload}`
  const loading = result.key !== requestKey

  useEffect(() => {
    let ignore = false
    fetchAppointments({ date, status, token })
      .then((r) => {
        if (!ignore) setResult({ key: requestKey, appointments: r.appointments, sample: r.sample, error: '' })
      })
      .catch((err) => {
        if (ignore) return
        if (err.code === 'unauthorized') {
          onLogout() // token expired: back to the login page
          return
        }
        setResult({ key: requestKey, appointments: [], sample: false, error: err.message })
      })
    return () => {
      ignore = true
    }
  }, [date, status, token, requestKey, onLogout])

  const appointments = loading ? [] : result.appointments
  const error = loading ? '' : result.error
  const selected = appointments.find((a) => a.id === selectedId) || null

  return (
    <div className="sched">
      <title>Clinic Schedule | Moral-Macatangay OB-GYN Clinic</title>
      <AppHeader user={user} onLogout={onLogout} current="schedule" />

      <main className="sched-main">
        <h1>Clinic Appointment Schedule</h1>
        <p className="sched-sub">{formatDateLong(date)}</p>

        <div className="sched-controls">
          <div className="date-nav" role="group" aria-label="Choose a day">
            <button type="button" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day">
              ‹
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              aria-label="Date"
            />
            <button type="button" onClick={() => setDate(addDays(date, 1))} aria-label="Next day">
              ›
            </button>
            <button type="button" className="today" onClick={() => setDate(today)} disabled={date === today}>
              Today
            </button>
          </div>

          <div className="filters" role="group" aria-label="Filter by status">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                className={status === f ? 'active' : ''}
                aria-pressed={status === f}
                onClick={() => setStatus(f)}
              >
                {f === 'all' ? 'All' : STATUS_LABELS[f]}
              </button>
            ))}
          </div>
        </div>

        {!loading && result.sample && (
          <div className="note">
            Showing sample appointments. The schedule service (backend 1.2.1) is not connected yet.
          </div>
        )}

        <div className="sched-body">
          <section className="sched-list" aria-label="Appointments" aria-busy={loading}>
            {loading ? (
              <div className="skeletons" role="status" aria-label="Loading appointments">
                {[0, 1, 2, 3].map((i) => (
                  <div className="skeleton" key={i} />
                ))}
              </div>
            ) : error ? (
              <div className="alert" role="alert">
                <p>{error}</p>
                <button type="button" onClick={() => setReload((n) => n + 1)}>
                  Try again
                </button>
              </div>
            ) : appointments.length === 0 ? (
              <div className="empty">
                <h2>No appointments</h2>
                <p>
                  There are no {status === 'all' ? '' : `${STATUS_LABELS[status].toLowerCase()} `}appointments on{' '}
                  {formatDateLong(date)}.
                </p>
                {status !== 'all' && (
                  <button type="button" onClick={() => setStatus('all')}>
                    Show all statuses
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="count">
                  {appointments.length} appointment{appointments.length === 1 ? '' : 's'}
                </p>
                <ul>
                  {appointments.map((a) => (
                    <li key={a.id}>
                      <button
                        type="button"
                        className={`row ${selectedId === a.id ? 'selected' : ''}`}
                        aria-pressed={selectedId === a.id}
                        onClick={() => setSelectedId(a.id)}
                      >
                        <span className="time">{formatTime(a.time)}</span>
                        <span className="who">
                          <strong>{a.patientName}</strong>
                          <small>{a.type}</small>
                        </span>
                        <span className={`badge ${a.status}`}>{STATUS_LABELS[a.status] || a.status}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>

          <aside className="sched-details" aria-live="polite">
            {selected ? (
              <>
                <div className="details-head">
                  <h2>Appointment details</h2>
                  <span className={`badge ${selected.status}`}>
                    {STATUS_LABELS[selected.status] || selected.status}
                  </span>
                </div>
                <dl>
                  <dt>Patient</dt>
                  <dd>{selected.patientName}</dd>
                  <dt>Date</dt>
                  <dd>{formatDateLong(selected.date)}</dd>
                  <dt>Time</dt>
                  <dd>{formatTime(selected.time)}</dd>
                  <dt>Type</dt>
                  <dd>{selected.type || '—'}</dd>
                  <dt>Contact</dt>
                  <dd>{selected.contact || '—'}</dd>
                  <dt>Notes</dt>
                  <dd>{selected.notes || '—'}</dd>
                </dl>
                <button type="button" className="close" onClick={() => setSelectedId(null)}>
                  Close
                </button>
              </>
            ) : (
              <p className="muted">Select an appointment to see its details.</p>
            )}
          </aside>
        </div>
      </main>
    </div>
  )
}