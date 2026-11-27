import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../db.js'
import { requirePatient } from '../middleware/auth.js'

const router = Router()

const emailOk = (v) => /^\S+@\S+\.\S+$/.test(v)
const phoneOk = (v) => /^(\+63|0)9\d{9}$/.test(String(v).replace(/[\s-]/g, ''))
const passwordOk = (v) => v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v)

// POST /api/patients/register
router.post('/register', async (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body || {}

  if (![firstName, lastName, email, phone, password].every((v) => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ message: 'Please fill in all required fields.' })
  }
  if (!emailOk(email)) return res.status(400).json({ message: 'Enter a valid email address.' })
  if (!phoneOk(phone)) return res.status(400).json({ message: 'Enter a valid PH mobile number.' })
  if (!passwordOk(password)) {
    return res.status(400).json({
      message: 'Password must be 8+ characters with uppercase, lowercase, and a number.',
    })
  }

  const cleanEmail = email.trim().toLowerCase()
  const conn = await pool.getConnection()
  try {
    const [existing] = await conn.query('SELECT id FROM patients WHERE email = ?', [cleanEmail])
    if (existing.length) return res.status(409).json({ message: 'Email is already registered.' })

    const hash = await bcrypt.hash(password, 12)

    // Account + profile sabay: kapag may pumalya, walang matitira
    await conn.beginTransaction()
    const [result] = await conn.query(
      'INSERT INTO patients (email, password_hash) VALUES (?, ?)',
      [cleanEmail, hash],
    )
    await conn.query(
      'INSERT INTO patient_profiles (patient_id, first_name, last_name, phone) VALUES (?, ?, ?, ?)',
      [result.insertId, firstName.trim(), lastName.trim(), phone.replace(/[\s-]/g, '')],
    )
    await conn.commit()

    res.status(201).json({ message: 'Account created.' })
  } catch (err) {
    await conn.rollback()
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email is already registered.' })
    }
    console.error(err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  } finally {
    conn.release()
  }
})

// POST /api/patients/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ message: 'Enter your email and password.' })
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, password_hash FROM patients WHERE email = ?',
      [String(email).trim().toLowerCase()],
    )
    const patient = rows[0]
    // Iisang mensahe para hindi malaman kung alin ang mali
    const valid = patient && (await bcrypt.compare(password, patient.password_hash))
    if (!valid) return res.status(401).json({ message: 'Incorrect email or password.' })

    const token = jwt.sign({ id: patient.id, role: 'patient' }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    })
    res.json({ token })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

// GET /api/patients/me  (protected)
router.get('/me', requirePatient, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.id, p.email, pr.first_name AS firstName, pr.last_name AS lastName, pr.phone
       FROM patients p JOIN patient_profiles pr ON pr.patient_id = p.id
       WHERE p.id = ?`,
      [req.patientId],
    )
    if (!rows.length) return res.status(404).json({ message: 'Patient not found.' })
    res.json(rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Server error. Please try again.' })
  }
})

export default router
