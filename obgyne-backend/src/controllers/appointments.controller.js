const pool = require('../config/db')
const { isValidISODate } = require('../utils/validate')

const VALID_STATUSES = ['pending', 'approved', 'rejected', 'completed']

async function listAppointments(req, res, next) {
  try {
    const { date, status } = req.query
    if (date !== undefined && (typeof date !== 'string' || !isValidISODate(date))) {
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
