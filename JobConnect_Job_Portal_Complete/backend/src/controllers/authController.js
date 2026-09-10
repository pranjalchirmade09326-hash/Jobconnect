const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

function tokenFor(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
}

function safeUser(user) {
  const data = user.toJSON();
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

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, password: passwordHash, role, phone, skills, companyName
    });

    res.status(201).json({ message: 'Registration successful', user: safeUser(user), token: tokenFor(user) });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password || '', user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({ message: 'Login successful', user: safeUser(user), token: tokenFor(user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
