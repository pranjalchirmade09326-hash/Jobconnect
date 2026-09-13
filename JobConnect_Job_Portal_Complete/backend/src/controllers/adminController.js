const { pool } = require('../config/db');

async function dashboard(req, res, next) {
  try {
    const [
      [uRows],
      [jRows],
      [aRows],
      [empRows],
      [seekRows]
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM users'),
      pool.query('SELECT COUNT(*) AS count FROM jobs'),
      pool.query('SELECT COUNT(*) AS count FROM applications'),
      pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'employer'"),
      pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'job_seeker'")
    ]);

    res.json({
      users: uRows[0].count,
      jobs: jRows[0].count,
      applications: aRows[0].count,
      employers: empRows[0].count,
      seekers: seekRows[0].count
    });
  } catch (err) {
    next(err);
  }
}

async function users(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, skills, companyName, createdAt, updatedAt FROM users ORDER BY createdAt DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [uRows] = await connection.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    const user = uRows[0];

    if (!user) {
      await connection.rollback();
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.id === req.user.id) {
      await connection.rollback();
      return res.status(400).json({ message: 'Admin cannot delete the current account' });
    }

    // Find and delete any jobs and related applications if user is employer
    const [jobs] = await connection.query('SELECT id FROM jobs WHERE employerId = ?', [user.id]);
    if (jobs.length > 0) {
      const jobIds = jobs.map(j => j.id);
      await connection.query('DELETE FROM applications WHERE jobId IN (?)', [jobIds]);
      await connection.query('DELETE FROM jobs WHERE id IN (?)', [jobIds]);
    }

    // Delete any applications made as a seeker
    await connection.query('DELETE FROM applications WHERE seekerId = ?', [user.id]);

    // Delete user
    await connection.query('DELETE FROM users WHERE id = ?', [user.id]);

    await connection.commit();
    res.json({ message: 'User and related records deleted successfully' });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
}

module.exports = { dashboard, users, deleteUser };
