const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { randomUUID } = require('crypto')
const validator = require('validator')
const pool = require('../config/db')

const ROLES = ['doctor', 'secretary']
const MAX_ATTEMPTS = Number(process.env.MAX_FAILED_ATTEMPTS || 5)
const LOCK_SECONDS = Number(process.env.LOCK_SECONDS || 60)
const INVALID = 'Incorrect email or password for the selected role.'

// Used so a wrong username takes as long to answer as a wrong password
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 10)

// POST /api/auth/login   body: { identifier, password, role }
async function login(req, res, next) {
  try {
    const { identifier, password, role } = req.body || {}

    // 1. Validate the request
    if (typeof identifier !== 'string' || typeof password !== 'string' || !identifier.trim() || !password) {
      return res.status(400).json({ message: 'Email or username and password are required.' })
    }
    if (identifier.includes('@') && !validator.isEmail(identifier.trim())) {
      return res.status(400).json({ message: 'Enter a valid email address.' })
    }
    if (identifier.length > 254 || password.length > 128) {
      return res.status(400).json({ message: INVALID })
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: 'Select a valid role (doctor or secretary).' })
    }

    // 2. Find the stored admin account (email OR username, and the chosen role)
    const id = identifier.trim().toLowerCase()
    const [rows] = await pool.query(
      'SELECT * FROM admins WHERE (email = ? OR username = ?) AND role = ? LIMIT 1',
      [id, id, role],
    )
    const admin = rows[0]

    if (!admin) {
      await bcrypt.compare(password, DUMMY_HASH)
      return res.status(401).json({ message: INVALID })
    }
    if (!admin.is_active) {
      return res.status(403).json({ message: 'This account is disabled. Contact the clinic administrator.' })
    }

    // 3. Limit repeated failed attempts: reject while the account is locked
    const now = new Date()
    if (admin.locked_until && new Date(admin.locked_until) > now) {
      const retryAfter = Math.ceil((new Date(admin.locked_until) - now) / 1000)
      return res.status(429).json({
        message: `Too many failed attempts. Try again in ${retryAfter}s.`,
        retryAfter,
      })
    }

    // 4. Verify the password against the stored hash
    const ok = await bcrypt.compare(password, admin.password_hash)
    if (!ok) {
      const attempts = admin.failed_attempts + 1
      if (attempts >= MAX_ATTEMPTS) {
        const lockedUntil = new Date(Date.now() + LOCK_SECONDS * 1000)
        await pool.query('UPDATE admins SET failed_attempts = 0, locked_until = ? WHERE id = ?', [
          lockedUntil,
          admin.id,
        ])
        return res.status(429).json({
          message: `Too many failed attempts. Try again in ${LOCK_SECONDS}s.`,
          retryAfter: LOCK_SECONDS,
        })
      }
      await pool.query('UPDATE admins SET failed_attempts = ? WHERE id = ?', [attempts, admin.id])
      return res.status(401).json({ message: INVALID })
    }

    // 5. Success: reset the counters and create the token
    await pool.query(
      'UPDATE admins SET failed_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?',
      [now, admin.id],
    )
    const token = jwt.sign({ sub: admin.id, role: admin.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      jwtid: randomUUID(),
    })

    return res.json({
      token,
      user: { id: admin.id, name: admin.full_name, email: admin.email, role: admin.role },
    })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/logout   (needs the token) - the token can no longer be used
async function logout(req, res, next) {
  try {
    const { jti, exp } = req.token
    await pool.query('INSERT IGNORE INTO revoked_tokens (jti, expires_at) VALUES (?, ?)', [
      jti,
      new Date(exp * 1000),
    ])
    // Housekeeping: forget revoked tokens that have expired anyway
    await pool.query('DELETE FROM revoked_tokens WHERE expires_at < ?', [new Date()])
    res.json({ message: 'Logged out successfully.' })
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me   (needs the token) - who is logged in
function me(req, res) {
  res.json({ user: req.admin })
}

module.exports = { login, logout, me }