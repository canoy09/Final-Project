import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

export async function loginDoctor(req, res, next) {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const remember = req.body?.remember === true;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [rows] = await pool.execute(
      `SELECT id, name, email, password_hash
       FROM doctors
       WHERE email = ? AND is_active = 1
       LIMIT 1`,
      [email]
    );

    // Use the same message whether the email or password is incorrect.
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Incorrect email or password. Please try again.' });
    }

    const doctor = rows[0];
    const passwordMatches = await bcrypt.compare(password, doctor.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Incorrect email or password. Please try again.' });
    }

    const expiresIn = remember ? '7d' : '1d';
    const token = jwt.sign(
      { sub: String(doctor.id), role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    return res.status(200).json({
      token,
      doctor: {
        id: doctor.id,
        name: doctor.name,
        email: doctor.email
      }
    });
  } catch (error) {
    next(error);
  }
}
