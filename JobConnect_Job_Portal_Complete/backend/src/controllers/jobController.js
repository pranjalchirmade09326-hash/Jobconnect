const { pool } = require('../config/db');

function mapJobRow(r) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    company: r.company,
    location: r.location,
    jobType: r.jobType,
    experience: r.experience,
    salaryMin: r.salaryMin,
    salaryMax: r.salaryMax,
    skills: r.skills,
    status: r.status,
    employerId: r.employerId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    employer: r.emp_id ? {
      id: r.emp_id,
      name: r.emp_name,
      companyName: r.emp_companyName
    } : null
  };
}

async function listJobs(req, res, next) {
  try {
    const { search, location, jobType, page = 1, limit = 6 } = req.query;
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 6, 1), 50);
    const offset = (safePage - 1) * safeLimit;

    let whereClause = "WHERE j.status = 'open'";
    const params = [];

    if (search) {
      whereClause += ' AND (j.title LIKE ? OR j.company LIKE ? OR j.skills LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (location) {
      whereClause += ' AND j.location LIKE ?';
      params.push(`%${location}%`);
    }
    if (jobType) {
      whereClause += ' AND j.jobType = ?';
      params.push(jobType);
    }

    const countSql = `SELECT COUNT(*) AS total FROM jobs j ${whereClause}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    const dataSql = `
      SELECT j.*,
             u.id AS emp_id,
             u.name AS emp_name,
             u.companyName AS emp_companyName
      FROM jobs j
      LEFT JOIN users u ON j.employerId = u.id
      ${whereClause}
      ORDER BY j.createdAt DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataSql, [...params, safeLimit, offset]);

    res.json({
      jobs: rows.map(mapJobRow),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getJob(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT j.*,
             u.id AS emp_id,
             u.name AS emp_name,
             u.companyName AS emp_companyName
      FROM jobs j
      LEFT JOIN users u ON j.employerId = u.id
      WHERE j.id = ?
    `, [req.params.id]);

    const job = rows[0];
    if (!job) return res.status(404).json({ message: 'Job not found' });

    res.json(mapJobRow(job));
  } catch (err) {
    next(err);
  }
}

async function mine(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT j.*,
             u.id AS emp_id,
             u.name AS emp_name,
             u.companyName AS emp_companyName
      FROM jobs j
      LEFT JOIN users u ON j.employerId = u.id
      WHERE j.employerId = ?
      ORDER BY j.createdAt DESC
    `, [req.user.id]);

    res.json(rows.map(mapJobRow));
  } catch (err) {
    next(err);
  }
}

async function createJob(req, res, next) {
  try {
    const required = ['title', 'description', 'company', 'location'];
    for (const field of required) {
      if (!req.body[field]) {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    const {
      title,
      description,
      company,
      location,
      jobType = 'Full-time',
      experience = null,
      salaryMin = null,
      salaryMax = null,
      skills = null,
      status = 'open'
    } = req.body;

    const [result] = await pool.query(`
      INSERT INTO jobs (title, description, company, location, jobType, experience, salaryMin, salaryMax, skills, status, employerId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      title,
      description,
      company,
      location,
      jobType,
      experience,
      salaryMin ? parseInt(salaryMin, 10) : null,
      salaryMax ? parseInt(salaryMax, 10) : null,
      skills,
      status,
      req.user.id
    ]);

    const [createdRows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [result.insertId]);
    res.status(201).json(createdRows[0]);
  } catch (err) {
    next(err);
  }
}

async function updateJob(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    const job = rows[0];
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (req.user.role !== 'admin' && job.employerId !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own jobs' });
    }

    const allowed = ['title', 'description', 'company', 'location', 'jobType', 'experience', 'salaryMin', 'salaryMax', 'skills', 'status'];
    const updates = [];
    const params = [];

    allowed.forEach(key => {
      if (req.body[key] !== undefined) {
        updates.push(`${key} = ?`);
        if (key === 'salaryMin' || key === 'salaryMax') {
          params.push(req.body[key] !== null ? parseInt(req.body[key], 10) : null);
        } else {
          params.push(req.body[key]);
        }
      }
    });

    if (updates.length > 0) {
      updates.push('updatedAt = NOW()');
      params.push(req.params.id);
      await pool.query(`UPDATE jobs SET ${updates.join(', ')} WHERE id = ?`, params);
    }

    const [updatedRows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    res.json(updatedRows[0]);
  } catch (err) {
    next(err);
  }
}

async function deleteJob(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    const job = rows[0];
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (req.user.role !== 'admin' && job.employerId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own jobs' });
    }

    await pool.query('DELETE FROM applications WHERE jobId = ?', [req.params.id]);
    await pool.query('DELETE FROM jobs WHERE id = ?', [req.params.id]);

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listJobs, getJob, mine, createJob, updateJob, deleteJob };
