import jwt from 'jsonwebtoken'

// Pang-protekta ng mga route na para lang sa naka-log in na pasyente
export function requirePatient(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ message: 'Please log in first.' })

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    if (payload.role !== 'patient') throw new Error('wrong role')
    req.patientId = payload.id
    next()
  } catch {
    res.status(401).json({ message: 'Your session has expired. Please log in again.' })
  }
}
