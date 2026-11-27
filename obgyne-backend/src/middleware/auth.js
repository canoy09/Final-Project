const jwt = require('jsonwebtoken')
const pool = require('../config/db')

// Protects a route: only logged-in admin accounts get through.
// Use it on every admin feature (schedule, records, follow-ups...).
async function requireAuth(req, res, next) {
  try {
    const [type, token] = (req.headers.authorization || '').split(' ')
    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Please log in first.' })
    }

    let payload
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
      return res.status(401).json({ message: 'Your session is invalid or has expired. Please log in again.' })
    }

    // Token was logged out?
    const [revoked] = await pool.query('SELECT 1 FROM revoked_tokens WHERE jti = ?', [payload.jti])
    if (revoked.length) {
      return res.status(401).json({ message: 'You are logged out. Please log in again.' })
    }

    // Account still exists and is active?
    const [rows] = await pool.query(
      'SELECT id, full_name, email, role, is_active FROM admins WHERE id = ?',
      [payload.sub],
    )
    const admin = rows[0]
    if (!admin || !admin.is_active) {
      return res.status(401).json({ message: 'Account not available. Please log in again.' })
    }

    req.admin = { id: admin.id, name: admin.full_name, email: admin.email, role: admin.role }
    req.token = { jti: payload.jti, exp: payload.exp }
    next()
  } catch (err) {
    next(err)
  }
}

// Optional: limit a route to certain roles, e.g. requireRole('doctor')
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({ message: 'You do not have permission to do this.' })
    }
    next()
  }
}

module.exports = { requireAuth, requireRole }
