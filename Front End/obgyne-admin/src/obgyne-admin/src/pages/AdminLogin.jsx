import { useEffect, useState } from 'react'
import { login, ROLES } from '../services/auth'
import './AdminLogin.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ identifier, password }) {
  const errors = {}
  const id = identifier.trim()
  if (!id) errors.identifier = 'Enter your email or username.'
  else if (id.includes('@') && !EMAIL_RE.test(id)) errors.identifier = 'Enter a valid email address.'
  if (!password) errors.password = 'Enter your password.'
  return errors
}

export default function AdminLogin({ onSuccess }) {
  const [role, setRole] = useState(ROLES.doctor.value)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [lockSeconds, setLockSeconds] = useState(0)

  // Countdown while the account is temporarily locked after repeated failures
  useEffect(() => {
    if (lockSeconds <= 0) return
    const t = setTimeout(() => setLockSeconds((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [lockSeconds])

  const locked = lockSeconds > 0

  function changeRole(next) {
    setRole(next)
    setFormError('')
    setSuccess('')
    setErrors({})
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (loading || locked) return
    const found = validate({ identifier, password })
    setErrors(found)
    setFormError('')
    setSuccess('')
    if (Object.keys(found).length) return

    setLoading(true)
    try {
      const session = await login({ identifier, password, role, remember })
      setSuccess(`Signed in as ${session.user.name}.`)
      setLoading(false)
      onSuccess?.(session) // hook for redirecting to a dashboard later
    } catch (err) {
      setPassword('')
      if (err.code === 'locked') setLockSeconds(err.retryAfter || 30)
      setFormError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const roleLabel = ROLES[role].label

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <header className="brand">
          <div className="brand-mark" aria-hidden="true">M</div>
          <div>
            <p className="brand-name">Moral-Macatangay OB-GYN Clinic</p>
            <p className="brand-place">CALACA, BATANGAS</p>
          </div>
        </header>

        <h1 id="login-title">Admin Log In</h1>
        <p className="lead">
          {role === 'doctor'
            ? 'View clinic schedules, access patient health records, and schedule follow-up checkups.'
            : 'Manage appointment requests, register patients, and record payments and inventory.'}
        </p>

        <div className="role-switch" role="radiogroup" aria-label="Log in as">
          {Object.values(ROLES).map((r) => (
            <button
              key={r.value}
              type="button"
              role="radio"
              aria-checked={role === r.value}
              className={role === r.value ? 'active' : ''}
              onClick={() => changeRole(r.value)}
              disabled={loading}
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {success && <div className="alert ok" role="status">{success}</div>}
          {formError && (
            <div className={`alert ${locked ? 'warn' : ''}`} role="alert">
              {locked ? `Too many failed attempts. Try again in ${lockSeconds}s.` : formError}
            </div>
          )}

          <div className="field">
            <label htmlFor="identifier">Email or username</label>
            <input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="Enter your email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              aria-invalid={!!errors.identifier}
              aria-describedby={errors.identifier ? 'identifier-err' : undefined}
              autoFocus
            />
            {errors.identifier && <p className="field-error" id="identifier-err">{errors.identifier}</p>}
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-wrap">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-err' : undefined}
              />
              <button
                type="button"
                className="toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-pressed={showPassword}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && <p className="field-error" id="password-err">{errors.password}</p>}
          </div>

          <label className="remember">
            <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
            Remember me
          </label>

          <button className="submit" type="submit" disabled={loading || locked}>
            {loading ? 'Signing in…' : locked ? `Try again in ${lockSeconds}s` : `Sign in as ${roleLabel}`}
          </button>
        </form>

        <p className="footnote">Authorized clinic personnel only. Patient records are confidential.</p>
      </section>
    </main>
  )
}