const pool = require('../config/db')

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'completed']

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

async function listAppointments(req, res, next) {
  try {
    const { date, status } = req.query
    if (date !== undefined && (typeof date !== 'string' || !isValidDate(date))) {
      return res.status(400).json({ message: 'Date must be a valid YYYY-MM-DD date.' })
    }
    if (status !== undefined && (typeof status !== 'string' || !VALID_STATUSES.includes(status))) {
      return res.status(400).json({ message: `Status must be one of: ${VALID_STATUSES.join(', ')}.` })
    }

    const conditions = []
    const values = []
    if (date) { conditions.push('appointment_date = ?'); values.push(date) }
    if (status) { conditions.push('status = ?'); values.push(status) }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const [rows] = await pool.query(
      `SELECT id, DATE_FORMAT(appointment_date, '%Y-%m-%d') AS date,
              TIME_FORMAT(appointment_time, '%H:%i') AS time,
              patient_name AS patientName, status, appointment_type AS type, contact, notes
       FROM appointments ${where}
       ORDER BY appointment_date ASC, appointment_time ASC, id ASC`,
      values,
    )
    return res.json({ appointments: rows })
  } catch (err) {
    return next(err)
  }
}

module.exports = { listAppointments }
