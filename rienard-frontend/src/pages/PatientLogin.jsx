import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import PasswordField from './PasswordField.jsx'
import { loginPatient } from '../services/auth.js'

export default function PatientLogin() {
  const [form, setForm] = useState({ email: '', password: '', remember: false })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  function validate() {
    const e = {}
    if (!form.email.trim()) e.email = 'Enter your email address.'
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = 'Enter a valid email address.'
    if (!form.password) e.password = 'Enter your password.'
    return e
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    setFormError('')
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    setLoading(true)
    try {
      await loginPatient({ ...form, email: form.email.trim() })
      // Send the patient to the main patient site when its address is set in .env
      const next = import.meta.env.VITE_DASHBOARD_URL
      if (next) window.location.assign(next)
      else setSuccess(true)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Patient Log In"
      subtitle="Book appointments, view your schedule, and access your health records."
      footer="Your personal and health information is kept confidential."
    >
      {success ? (
        <div className="alert alert-success" role="status">You are signed in.</div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {formError && <div className="alert alert-error" role="alert">{formError}</div>}

          <div className="field">
            <label htmlFor="email">Email</label>
            <div className={`input-wrap ${errors.email ? 'has-error' : ''}`}>
              <input
                id="email" type="email" autoComplete="email" placeholder="Email"
                value={form.email} onChange={set('email')}
                aria-invalid={Boolean(errors.email)}
              />
            </div>
            {errors.email && <p className="field-error">{errors.email}</p>}
          </div>

          <PasswordField
            id="password" label="Password" placeholder="Enter your password"
            autoComplete="current-password"
            value={form.password} onChange={set('password')} error={errors.password}
          />

          <label className="check">
            <input type="checkbox" checked={form.remember} onChange={set('remember')} />
            Remember me
          </label>

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      )}

      <p className="switch">
        New patient? <Link to="/signup">Create an account</Link>
      </p>
    </AuthLayout>
  )
}