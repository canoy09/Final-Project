// Creates (or resets) the two admin accounts. Run:  npm run seed
// Running it again resets the passwords and unlocks the accounts.
require('dotenv').config()
const bcrypt = require('bcryptjs')
const pool = require('../src/config/db')


const accounts = [
  {
    name: 'Dr. Moral-Macatangay',
    username: 'doctor',
    email: 'doctor@gmail.com',
    password: 'Doctor Clinic',
    role: 'doctor'
  },
  {
    name: 'Clinic Secretary',
    username: 'secretary',
    email: 'secretary@gmail.com',
    password: 'Secretary Clinic',
    role: 'secretary'
  }
]

async function main() {
  for (const a of accounts) {
    const hash = await bcrypt.hash(a.password, 10)
    await pool.query(
      `INSERT INTO admins (full_name, username, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
         full_name = VALUES(full_name), email = VALUES(email), password_hash = VALUES(password_hash),
         role = VALUES(role), is_active = 1, failed_attempts = 0, locked_until = NULL`,
      [a.name, a.username, a.email, hash, a.role],
    )
    console.log(`Saved ${a.role}: ${a.email} / ${a.password}`)
  }
  await pool.end()
}

main().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
