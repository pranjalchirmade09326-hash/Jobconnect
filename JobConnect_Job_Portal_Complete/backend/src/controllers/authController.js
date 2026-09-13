const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

function tokenFor(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'jobconnect_jwt_secret_key_2026_secure',
    { expiresIn: '1d' }
  );
}

function safeUser(user) {
  const data = { ...user };
  delete data.password;
  return data;
}

async function register(req, res, next) {
  try {
    const { name, email, password, role = 'job_seeker', phone, skills, companyName } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }
    if (!['job_seeker', 'employer'].includes(role)) {
      return res.status(400).json({ message: 'Public registration is only for job_seeker or employer' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must contain at least 8 characters' });
    }

    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, role, phone, skills, companyName, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [name, email, passwordHash, role, phone || null, skills || null, companyName || null]
    );

    const [createdRows] = await pool.query(
      'SELECT id, name, email, role, phone, skills, companyName, createdAt, updatedAt FROM users WHERE id = ?',
      [result.insertId]
    );
    const user = createdRows[0];

    res.status(201).json({
      message: 'Registration successful',
      user: safeUser(user),
      token: tokenFor(user)
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password || '', user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      message: 'Login successful',
      user: safeUser(user),
      token: tokenFor(user)
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
