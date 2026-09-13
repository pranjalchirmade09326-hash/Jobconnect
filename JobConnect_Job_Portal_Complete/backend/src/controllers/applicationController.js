const { pool } = require('../config/db');

function mapApplicationWithJob(r) {
  return {
    id: r.id,
    status: r.status,
    coverLetter: r.coverLetter,
    jobId: r.jobId,
    seekerId: r.seekerId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    job: r.j_id ? {
      id: r.j_id,
      title: r.j_title,
      description: r.j_description,
      company: r.j_company,
      location: r.j_location,
      jobType: r.j_jobType,
      experience: r.j_experience,
      salaryMin: r.j_salaryMin,
      salaryMax: r.j_salaryMax,
      skills: r.j_skills,
      status: r.j_status,
      employerId: r.j_employerId,
      createdAt: r.j_createdAt,
      updatedAt: r.j_updatedAt
    } : null
  };
}

function mapApplicationWithSeeker(r) {
  return {
    id: r.id,
    status: r.status,
    coverLetter: r.coverLetter,
    jobId: r.jobId,
    seekerId: r.seekerId,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    seeker: r.u_id ? {
      id: r.u_id,
      name: r.u_name,
      email: r.u_email,
      phone: r.u_phone,
      skills: r.u_skills
    } : null
  };
}

async function apply(req, res, next) {
  try {
    const [jobRows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [req.params.jobId]);
    const job = jobRows[0];
    if (!job || job.status !== 'open') {
      return res.status(404).json({ message: 'Open job not found' });
    }

    const [existing] = await pool.query(
      'SELECT id FROM applications WHERE jobId = ? AND seekerId = ?',
      [job.id, req.user.id]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'You already applied for this job' });
    }

    const [result] = await pool.query(
      'INSERT INTO applications (jobId, seekerId, coverLetter, status, createdAt, updatedAt) VALUES (?, ?, ?, "applied", NOW(), NOW())',
      [job.id, req.user.id, req.body.coverLetter || '']
    );

    const [createdRows] = await pool.query('SELECT * FROM applications WHERE id = ?', [result.insertId]);
    res.status(201).json(createdRows[0]);
  } catch (err) {
    next(err);
  }
}

async function myApplications(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT a.*,
             j.id AS j_id,
             j.title AS j_title,
             j.description AS j_description,
             j.company AS j_company,
             j.location AS j_location,
             j.jobType AS j_jobType,
             j.experience AS j_experience,
             j.salaryMin AS j_salaryMin,
             j.salaryMax AS j_salaryMax,
             j.skills AS j_skills,
             j.status AS j_status,
             j.employerId AS j_employerId,
             j.createdAt AS j_createdAt,
             j.updatedAt AS j_updatedAt
      FROM applications a
      LEFT JOIN jobs j ON a.jobId = j.id
      WHERE a.seekerId = ?
      ORDER BY a.createdAt DESC
    `, [req.user.id]);

    res.json(rows.map(mapApplicationWithJob));
  } catch (err) {
    next(err);
  }
}

async function jobApplicants(req, res, next) {
  try {
    const [jobRows] = await pool.query('SELECT * FROM jobs WHERE id = ?', [req.params.jobId]);
    const job = jobRows[0];
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.employerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not own this job' });
    }

    const [rows] = await pool.query(`
      SELECT a.*,
             u.id AS u_id,
             u.name AS u_name,
             u.email AS u_email,
             u.phone AS u_phone,
             u.skills AS u_skills
      FROM applications a
      LEFT JOIN users u ON a.seekerId = u.id
      WHERE a.jobId = ?
      ORDER BY a.createdAt DESC
    `, [job.id]);

    res.json(rows.map(mapApplicationWithSeeker));
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT a.*,
             j.id AS j_id,
             j.title AS j_title,
             j.employerId AS j_employerId,
             j.company AS j_company
      FROM applications a
      LEFT JOIN jobs j ON a.jobId = j.id
      WHERE a.id = ?
    `, [req.params.id]);

    const row = rows[0];
    if (!row) return res.status(404).json({ message: 'Application not found' });

    if (row.j_employerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not own this job' });
    }

    const allowed = ['applied', 'shortlisted', 'rejected', 'hired'];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid application status' });
    }

    await pool.query('UPDATE applications SET status = ?, updatedAt = NOW() WHERE id = ?', [
      req.body.status,
      req.params.id
    ]);

    const [updatedRows] = await pool.query(`
      SELECT a.*,
             j.id AS j_id,
             j.title AS j_title,
             j.company AS j_company,
             j.employerId AS j_employerId
      FROM applications a
      LEFT JOIN jobs j ON a.jobId = j.id
      WHERE a.id = ?
    `, [req.params.id]);

    const updated = updatedRows[0];
    res.json({
      id: updated.id,
      status: updated.status,
      coverLetter: updated.coverLetter,
      jobId: updated.jobId,
      seekerId: updated.seekerId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
      job: updated.j_id ? {
        id: updated.j_id,
        title: updated.j_title,
        company: updated.j_company,
        employerId: updated.j_employerId
      } : null
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { apply, myApplications, jobApplicants, updateStatus };
