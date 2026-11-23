import { useCallback, useEffect, useState } from 'react'
import AdminLogin from './pages/AdminLogin'
import Schedule from './pages/Schedule'
import { getSession, logout } from './services/auth'
import './App.css'

function App() {
  // A saved session means the admin is already logged in
  const [session, setSession] = useState(() => getSession())

  const handleLogout = useCallback(async () => {
    await logout()
    setSession(null)
  }, [])

  // The address bar follows the page:
  //   logged out -> /login     logged in -> /schedule
  // Typing /schedule while logged out sends you to /login, and typing /login
  // while logged in sends you to /schedule. Add new pages here later.
  const path = session ? '/schedule' : '/login'
  useEffect(() => {
    if (window.location.pathname !== path) {
      window.history.replaceState(null, '', path)
    }
  }, [path])

  return session ? (
    <Schedule session={session} onLogout={handleLogout} />
  ) : (
    <AdminLogin onSuccess={setSession} />
  )
}

export default App