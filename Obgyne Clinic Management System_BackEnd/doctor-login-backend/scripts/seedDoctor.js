import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pool from '../src/config/db.js';

async function seedDoctor() {
  const name = process.env.DOCTOR_NAME?.trim();
  const email = process.env.DOCTOR_EMAIL?.trim().toLowerCase();
  const password = process.env.DOCTOR_PASSWORD;

  if (!name || !email || !password) {
    throw new Error('Set DOCTOR_NAME, DOCTOR_EMAIL, and DOCTOR_PASSWORD in your .env file first.');
  }
  if (password.length < 10) {
    throw new Error('For this setup, use a doctor password with at least 10 characters.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.execute(
    `INSERT INTO doctors (name, email, password_hash, is_active)
     VALUES (?, ?, ?, 1)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       password_hash = VALUES(password_hash),
       is_active = 1`,
    [name, email, passwordHash]
  );

  console.log(`Doctor account created/updated: ${email}`);
}

try {
  await seedDoctor();
} catch (error) {
  console.error('Could not create doctor account:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
