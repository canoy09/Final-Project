// Adds starter patient accounts to the real MySQL database.
// Run:  npm run seed
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { pool } from './db.js'

if (process.env.NODE_ENV === 'production') {
  console.error('Seeding is disabled in production.')
  process.exit(1)
}

const patients = [
  { firstName: 'Ana', lastName: 'Reyes', email: 'ana.reyes@clinic.test', phone: '09171234501', password: 'Patient123' },
  { firstName: 'Liza', lastName: 'Cruz', email: 'liza.cruz@clinic.test', phone: '09171234502', password: 'Patient123' },
]

const conn = await pool.getConnection()
try {
  for (const p of patients) {
    const [exists] = await conn.query('SELECT id FROM patients WHERE email = ?', [p.email])
    if (exists.length) {
      console.log(`Skipped (already exists): ${p.email}`)
      continue
    }
    const hash = await bcrypt.hash(p.password, 12)
    await conn.beginTransaction()
    const [r] = await conn.query('INSERT INTO patients (email, password_hash) VALUES (?, ?)', [p.email, hash])
    await conn.query(
      'INSERT INTO patient_profiles (patient_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
      [r.insertId, p.firstName, p.lastName, p.phone],
    )
    await conn.commit()
    console.log(`Added: ${p.email}  (password: ${p.password})`)
  }
} catch (err) {
  await conn.rollback()
  console.error('Seeding failed:', err.code || err.message)
  process.exitCode = 1
} finally {
  conn.release()
  await pool.end()
}
