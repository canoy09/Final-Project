import { useState } from 'react'

export default function PasswordField({ id, label, value, onChange, onBlur, error, placeholder, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={`input-wrap ${error ? 'has-error' : ''}`}>
        <input
          id={id}
          name={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-err` : undefined}
        />
        <button type="button" className="show-btn" onClick={() => setShow((s) => !s)}>
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <p className="field-error" id={`${id}-err`}>{error}</p>}
    </div>
  )
}
