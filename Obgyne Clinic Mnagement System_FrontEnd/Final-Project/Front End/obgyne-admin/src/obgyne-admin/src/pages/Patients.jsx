import { useEffect, useState } from 'react'
import AppHeader from '../components/AppHeader'
import { fetchPatients } from '../services/patients'
import { normalizeSearch, validateSearch, SEARCH_MAX_LENGTH } from '../utils/validators'
import { formatDate } from '../utils/format'
import { linkProps, replaceUrl } from '../router'
import './Schedule.css' // shared page + glass styles
import './Patients.css'

const PAGE_SIZE = 10

function buildUrl(search, page) {
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (page > 1) params.set('page', String(page))
  const qs = params.toString()
  return qs ? `/patients?${qs}` : '/patients'
}

// Search and page are kept in the address bar, so the Back button from a
// record returns to the same results.
function readUrl() {
  const params = new URLSearchParams(window.location.search)
  const search = normalizeSearch(params.get('search') || '')
  const page = Math.max(1, parseInt(params.get('page') || '1', 10) || 1)
  return { search: validateSearch(search) ? '' : search, page }
}

export default function Patients({ session, onLogout }) {
  const { user, token } = session
  const [initial] = useState(readUrl)
  const [input, setInput] = useState(initial.search) // what the admin is typing
  const [query, setQuery] = useState(initial.search) // what is actually searched (after a short pause)
  const [page, setPage] = useState(initial.page)
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState({ key: '', patients: [], total: 0, error: '' })

  const inputError = validateSearch(input)

  // Search 350 ms after typing stops, and only when the text is valid
  useEffect(() => {
    if (inputError) return undefined
    const next = normalizeSearch(input)
    if (next === query) return undefined
    const timer = setTimeout(() => {
      setQuery(next)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [input, inputError, query])

  useEffect(() => replaceUrl(buildUrl(query, page)), [query, page])

  const requestKey = `${query}|${page}|${reload}`
  const loading = result.key !== requestKey

  useEffect(() => {
    let ignore = false
    fetchPatients({ search: query, page, limit: PAGE_SIZE, token })
      .then((r) => {
        if (!ignore) setResult({ key: requestKey, patients: r.patients, total: r.total, error: '' })
      })
      .catch((err) => {
        if (ignore) return
        if (err.code === 'unauthorized') {
          onLogout() // token expired: back to the login page
          return
        }
        setResult({ key: requestKey, patients: [], total: 0, error: err.message })
      })
    return () => {
      ignore = true
    }
  }, [query, page, token, requestKey, onLogout])

  const patients = loading ? [] : result.patients
  const error = loading ? '' : result.error
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE))
  const from = (page - 1) * PAGE_SIZE + 1
  const to = from + patients.length - 1

  function clearSearch() {
    setInput('')
    setQuery('')
    setPage(1)
  }

  return (
    <div className="sched">
      <title>Patient Records | Moral-Macatangay OB-GYN Clinic</title>
      <AppHeader user={user} onLogout={onLogout} current="patients" />

      <main className="sched-main">
        <h1>Patient Records</h1>
        <p className="sched-sub">Search by patient name or patient ID, then open a record.</p>

        <div className="search-bar">
          <label htmlFor="patient-search" className="sr-only">Search patients</label>
          <div className="search-field">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              id="patient-search"
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search name or patient ID (e.g. Maria or P-0001)"
              maxLength={SEARCH_MAX_LENGTH + 20}
              autoComplete="off"
              aria-invalid={!!inputError}
              aria-describedby={inputError ? 'search-err' : undefined}
            />
          </div>
          {inputError && (
            <p className="search-error" id="search-err" role="alert">
              {inputError}
            </p>
          )}
        </div>

        <section className="sched-list patient-list" aria-label="Patients" aria-busy={loading}>
          {loading ? (
            <div className="skeletons" role="status" aria-label="Loading patients">
              {[0, 1, 2, 3, 4].map((i) => (
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
          ) : patients.length === 0 ? (
            <div className="empty">
              <h2>{query ? 'No patients found' : 'No patient records yet'}</h2>
              <p>
                {query
                  ? `Nothing matches “${query}”. Check the spelling, or try the patient ID (for example P-0001).`
                  : 'Patient records will appear here once patients are registered.'}
              </p>
              {query && (
                <button type="button" onClick={clearSearch}>
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="count" role="status">
                Showing {from}–{to} of {result.total} patient{result.total === 1 ? '' : 's'}
                {query ? ` matching “${query}”` : ''}
              </p>
              <ul>
                {patients.map((p) => (
                  <li key={p.id}>
                    <a className="patient-row" {...linkProps(`/patients/${p.id}`)}>
                      <span className="code">{p.patientCode}</span>
                      <span className="who">
                        <strong>{p.fullName}</strong>
                        <small>
                          Age {p.age}
                          {p.contactNumber ? ` · ${p.contactNumber}` : ''}
                        </small>
                      </span>
                      <span className="last">
                        <small>Last check-up</small>
                        {p.lastCheckupDate ? formatDate(p.lastCheckupDate) : 'None yet'}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav className="pager" aria-label="Pages">
                  <button type="button" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                    ‹ Previous
                  </button>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <button type="button" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
                    Next ›
                  </button>
                </nav>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
