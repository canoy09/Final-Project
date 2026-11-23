require('dotenv').config()
const mysql = require('mysql2/promise')

// Connection pool to MySQL (XAMPP).
// timezone 'Z' keeps all DATETIME values in UTC so lock timers are consistent.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'obgyne_clinic',
  timezone: 'Z',
  waitForConnections: true,
  connectionLimit: 10,
})

module.exports = pool
