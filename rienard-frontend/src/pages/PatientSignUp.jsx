import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from './AuthLayout.jsx'
import PasswordField from './PasswordField.jsx'
import { registerPatient } from '../services/auth.js'

const empty = { firstName: '', lastName: '', email: '', phone: '', password: '', confirm: '' }

function validateField(name, v, form) {
  switch (name) {
    case 'firstName': return v.trim() ? '' : 'Enter your first name.'
    case 'lastName': return v.trim() ? '' : 'Enter your last name.'
    case 'email':
      if (!v.trim()) return 'Enter your email address.'
      return /^\S+@\S+\.\S+$/.test(v) ? '' : 'Enter a valid email address.'
    case 'phone':
      if (!v.trim()) return 'Enter your mobile number.'
      return /^(\+63|0)9\d{9}$/.test(v.replace(/[\s-]/g, '')) ? '' : 'Use a valid PH mobile number, e.g. 09123456789.'
    case 'password':
      if (!v) return 'Create a password.'
      if (v.length < 8) return 'Password must be at least 8 characters.'
      if (!/[A-Z]/.test(v) || !/[a-z]/.test(v)) return 'Use both uppercase and lowercase letters.'
      if (!/\d/.test(v)) return 'Include at least one number.'
      return ''
    case 'confirm':
      if (!v) return 'Re-enter your password.'
      return v === form.password ? '' : 'Passwords do not match.'
    default: return ''
  }
}

export default function PatientSignUp() {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (name) => (e) => {
    const value = e.target.value
    setForm((f) => ({ ...f, [name]: value }))
    if (errors[name]) setErrors((er) => ({ ...er, [name]: '' }))
  }
  const check = (name) => () =>
    setErrors((er) => ({ ...er, [name]: validateField(name, form[name], form) }))

  async function handleSubmit(ev) {
    ev.preventDefault()
    setFormError('')
    const e = {}
    Object.keys(empty).forEach((k) => { e[k] = validateField(k, form[k], form) })
    setErrors(e)
    if (Object.values(e).some(Boolean)) return

    setLoading(true)
    try {
      // eslint-disable-next-line no-unused-vars
      const { confirm, ...payload } = form
      await registerPatient({ ...payload, email: payload.email.trim().toLowerCase() })
      setSuccess(true)
      setForm(empty)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setFormError(err.message) // e.g. "Email is already registered."
    } finally {
      setLoading(false)
    }
  }

  const text = (name, label, props = {}) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <div className={`input-wrap ${errors[name] ? 'has-error' : ''}`}>
        <input
          id={name} value={form[name]} onChange={set(name)} onBlur={check(name)}
          aria-invalid={Boolean(errors[name])} {...props}
        />
      </div>
      {errors[name] && <p className="field-error">{errors[name]}</p>}
    </div>
  )

  return (
    <AuthLayout
      title="Create Patient Account"
      subtitle="Register once to book appointments and view your records."
      footer="Your personal and health information is kept confidential."
    >
      {success ? (
        <div className="alert alert-success" role="status">
          Account created. Taking you to the log in page…
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate>
          {formError && <div className="alert alert-error" role="alert">{formError}</div>}

          <div className="row">
            {text('firstName', 'First name', { autoComplete: 'given-name' })}
            {text('lastName', 'Last name', { autoComplete: 'family-name' })}
          </div>
          {text('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'Email' })}
          {text('phone', 'Mobile number', { type: 'tel', autoComplete: 'tel', placeholder: '09XXXXXXXXX' })}

          <PasswordField
            id="password" label="Password" placeholder="At least 8 characters"
            autoComplete="new-password"
            value={form.password} onChange={set('password')} onBlur={check('password')}
            error={errors.password}
          />
          <p className="hint">Use 8+ characters with uppercase, lowercase, and a number.</p>

          <PasswordField
            id="confirm" label="Confirm password" placeholder="Re-enter your password"
            autoComplete="new-password"
            value={form.confirm} onChange={set('confirm')} onBlur={check('confirm')}
            error={errors.confirm}
          />

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}

      <p className="switch">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  )
}