import { Navigate, Route, Routes } from 'react-router-dom'
import PatientLogin from './pages/PatientLogin.jsx'
import PatientSignUp from './pages/PatientSignUp.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PatientLogin />} />
      <Route path="/signup" element={<PatientSignUp />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}