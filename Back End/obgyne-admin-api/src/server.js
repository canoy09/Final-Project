require('dotenv').config()
const express = require('express')
const cors = require('cors')
const pool = require('./config/db')
const authRoutes = require('./routes/auth.routes')
const adminRoutes = require('./routes/admin.routes')

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy .env.example to .env and set it.')
  process.exit(1)
}

const app = express()

// CORS: only the React frontend addresses in CORS_ORIGIN may call this API.
// Requests with no origin (Postman) are allowed.
const allowed = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map((s) => s.trim())
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowed.includes(origin)) return cb(null, true)
      cb(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)

app.use((req, res) => res.status(404).json({ message: 'Route not found.' }))

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') return res.status(403).json({ message: err.message })
  console.error(err)
  res.status(500).json({ message: 'Server error. Please try again.' })
})

const port = Number(process.env.PORT || 3000)
app.listen(port, async () => {
  console.log(`API running at http://localhost:${port}/api`)
  try {
    await pool.query('SELECT 1')
    console.log('Database connected.')
  } catch (err) {
    console.error('Database NOT connected. Is MySQL running in XAMPP and is the schema imported?')
    console.error(err.message)
  }
})
