import { useState } from 'react'
import { ROLES } from '../services/auth'
import { initials } from '../utils/format'
import { linkProps } from '../router'
import '../pages/Schedule.css' // base header styles live here
import './AppHeader.css'

// Top bar shared by every logged-in page.
//   current: 'schedule' | 'patients'  (highlights that tab)
export default function AppHeader({ user, onLogout, current }) {
  const [loggingOut, setLoggingOut] = useState(false)
  const canViewRecords = user.role === 'doctor' // health records are doctor-only

  async function handleLogout() {
    setLoggingOut(true)
    await onLogout()
  }

  const tab = (key, label, href) => (
    <a
      className={`bar-link ${current === key ? 'active' : ''}`}
      aria-current={current === key ? 'page' : undefined}
      {...linkProps(href)}
    >
      {label}
    </a>
  )

  return (
    <header className="sched-bar">
      <div className="bar-brand">
        <div className="bar-mark" aria-hidden="true">M</div>
        <div>
          <strong>Moral-Macatangay OB-GYN Clinic</strong>
          <span>CALACA, BATANGAS</span>
        </div>
      </div>

      <nav className="bar-nav" aria-label="Main">
        {tab('schedule', 'Schedule', '/schedule')}
        {canViewRecords && tab('patients', 'Patient Records', '/patients')}
      </nav>

      <div className="bar-user">
        <div className="avatar" aria-hidden="true">{initials(user.name)}</div>
        <div className="user-info">
          <strong>{user.name}</strong>
          <span className="role-chip">{ROLES[user.role]?.label}</span>
        </div>
        <button type="button" className="logout" onClick={handleLogout} disabled={loggingOut}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <path d="M16 17l5-5-5-5" />
            <path d="M21 12H9" />
          </svg>
          {loggingOut ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </header>
  )
}
