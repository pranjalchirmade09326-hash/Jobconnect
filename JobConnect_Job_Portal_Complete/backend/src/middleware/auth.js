const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jobconnect_jwt_secret_key_2026_secure');
    
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, skills, companyName, createdAt, updatedAt FROM users WHERE id = ?',
      [decoded.id]
    );
    const user = rows[0];

    if (!user) return res.status(401).json({ message: 'User no longer exists' });

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied for this role' });
    }
    next();
  };
}

module.exports = { protect, authorize };
