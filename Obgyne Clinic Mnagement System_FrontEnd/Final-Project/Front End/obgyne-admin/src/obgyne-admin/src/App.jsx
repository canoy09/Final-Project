
import { useCallback, useEffect, useState } from 'react'
import AdminLogin from './pages/AdminLogin'
import Schedule from './pages/Schedule'
import Patients from './pages/Patients'
import PatientRecord from './pages/PatientRecord'
import { getSession, logout } from './services/auth'
import { navigate, usePath } from './router'
import './App.css'

function parseRoute(path) {
  const pathname = path.split('?')[0].replace(/\/+$/, '') || '/'
  if (pathname === '/schedule') return { name: 'schedule' }
  if (pathname === '/patients') return { name: 'patients' }

  const match = pathname.match(/^\/patients\/([^/]+)$/)
  if (match) {
    try {
      return { name: 'record', id: decodeURIComponent(match[1]) }
    } catch {
      return { name: 'unknown' }
    }
  }

  return { name: 'unknown' }
}

function SecretarySignedIn({ onLogout }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f5f1eb',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '16px',
        textAlign: 'center',
        maxWidth: '420px',
        width: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <h1 style={{ color: '#527963' }}>✓ Signed in successfully!</h1>
        <p>You are signed in as Secretary.</p>
        <button onClick={onLogout}>Log out</button>
      </div>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(() => getSession())
  const path = usePath()
  const route = parseRoute(path)

  const handleLogout = useCallback(async () => {
    await logout()
    setSession(null)
    navigate('/login', { replace: true })
  }, [])

  const isSecretary = session?.user?.role === 'secretary'
  const isRecordPage = route.name === 'patients' || route.name === 'record'
  const canViewRecords = session?.user?.role === 'doctor'

  let redirectTo = null

  if (!session) {
    redirectTo = '/login'
  } else if (!isSecretary && (
    route.name === 'unknown' || (isRecordPage && !canViewRecords)
  )) {
    redirectTo = '/schedule'
  }

  useEffect(() => {
    if (redirectTo) navigate(redirectTo, { replace: true })
  }, [redirectTo, path])

  if (!session) return <AdminLogin onSuccess={setSession} />

  // Secretary sees only the login confirmation.
  if (isSecretary) {
    return <SecretarySignedIn onLogout={handleLogout} />
  }

  if (redirectTo) return null

  switch (route.name) {
    case 'patients':
      return <Patients session={session} onLogout={handleLogout} />

    case 'record':
      return (
        <PatientRecord
          key={route.id}
          patientRef={route.id}
          session={session}
          onLogout={handleLogout}
        />
      )

    default:
      return <Schedule session={session} onLogout={handleLogout} />
  }
}

export default App
