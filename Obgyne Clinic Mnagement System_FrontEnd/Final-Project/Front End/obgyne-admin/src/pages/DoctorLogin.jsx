import { useId, useState } from 'react'
import { loginDoctor } from '../services/auth.js'
import './DoctorLogin.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate({ email, password }) {
  const errors = {}
  if (!email.trim()) errors.email = 'Please enter your email address.'
  else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address.'
  if (!password) errors.password = 'Please enter your password.'
  return errors
}

export default function DoctorLogin({ onSuccess }) {
  const uid = useId()
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: value }))
    if (errors[field]) setErrors((er) => ({ ...er, [field]: undefined }))
    if (formError) setFormError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const found = validate(form)
    setErrors(found)
    if (Object.keys(found).length) return

    setLoading(true)
    setFormError('')
    try {
      const { doctor } = await loginDoctor({
        email: form.email.trim(),
        password: form.password,
        remember: form.remember,
      })
      onSuccess(doctor)
    } catch (err) {
      setFormError(err.message)
      setLoading(false)
    }
  }

  return (
    <main className="login">
      <div className="login__scrim" aria-hidden="true" />

      <section className="login__card" aria-labelledby={`${uid}-title`}>
        <div className="login__brand">
          <span className="login__mark" aria-hidden="true">M</span>
          <div>
            <p className="login__clinic">Moral-Macatangay OB-GYN Clinic</p>
            <p className="login__dept">Calaca, Batangas</p>
          </div>
        </div>

        <h1 id={`${uid}-title`} className="login__title">Admin / Doctor Log In</h1>
        <p className="login__subtitle">View clinic schedules, access patient health records, and schedule follow-up checkups.</p>

        <form onSubmit={handleSubmit} noValidate>
          {formError && (
            <div className="login__alert" role="alert">
              {formError}
            </div>
          )}

          <div className="field">
            <label htmlFor={`${uid}-email`}>Email</label>
            <input
              id={`${uid}-email`}
              type="email"
              autoComplete="username"
              placeholder="doctor@example.com"
              value={form.email}
              onChange={update('email')}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? `${uid}-email-err` : undefined}
              disabled={loading}
            />
            {errors.email && <p id={`${uid}-email-err`} className="field__error">{errors.email}</p>}
          </div>

          <div className="field">
            <label htmlFor={`${uid}-password`}>Password</label>
            <div className="field__password">
              <input
                id={`${uid}-password`}
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={form.password}
                onChange={update('password')}
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? `${uid}-password-err` : undefined}
                disabled={loading}
              />
              <button
                type="button"
                className="field__toggle"
                onClick={() => setShowPassword((s) => !s)}
                aria-pressed={showPassword}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {errors.password && (
              <p id={`${uid}-password-err`} className="field__error">{errors.password}</p>
            )}
          </div>

          <div className="login__row">
            <label className="check">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={update('remember')}
                disabled={loading}
              />
              <span>Remember me</span>
            </label>
          </div>

          <button type="submit" className="login__submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" aria-hidden="true" /> Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="login__foot">Authorized clinic personnel only. Patient records are confidential.</p>
      </section>
    </main>
  )
}