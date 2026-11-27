import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import patientRoutes from './routes/patients.js'
import { pool } from './db.js'

if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET. Copy .env.example to .env first.')
  process.exit(1)
}

const app = express()

// CORS: papayagan lang ang React app (Vite) na tumawag sa API na ito
app.use(
  cors({
    origin: (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
)
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/patients', patientRoutes)

app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }))

const port = process.env.PORT || 5000
app.listen(port, async () => {
  console.log(`API running at http://localhost:${port}`)
  try {
    await pool.query('SELECT 1')
    console.log('MySQL connected.')
  } catch (err) {
    console.error('MySQL connection failed. Is XAMPP MySQL running?', err.code)
  }
})
