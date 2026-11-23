import './auth.css'

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <header className="brand">
          <div className="brand-mark" aria-hidden="true">M</div>
          <div>
            <h2 className="brand-name">Moral-Macatangay OB-GYN Clinic</h2>
            <p className="brand-place">CALACA, BATANGAS</p>
          </div>
        </header>

        <h1 className="auth-title">{title}</h1>
        <p className="auth-sub">{subtitle}</p>

        {children}

        <p className="auth-note">{footer}</p>
      </section>
    </main>
  )
}
