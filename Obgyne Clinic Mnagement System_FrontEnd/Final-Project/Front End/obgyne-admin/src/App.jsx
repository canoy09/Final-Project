import { useState } from 'react'
import DoctorLogin from './pages/DoctorLogin.jsx'
import './App.css'

function App() {
  const [doctor, setDoctor] = useState(null)

  if (!doctor) {
    return <DoctorLogin onSuccess={setDoctor} />
  }

  // TODO: replace with the admin dashboard / schedule view (WBS 1.1.1 and onward).
  return (
    <main className="placeholder">
      <h1>Welcome, {doctor.name}</h1>
      <p>You are logged in. The admin dashboard is coming next.</p>
      <button type="button" onClick={() => setDoctor(null)}>
        Log out
      </button>
    </main>
  )
}

export default App
