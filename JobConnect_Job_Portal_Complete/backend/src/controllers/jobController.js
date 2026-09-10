const { Op } = require('sequelize');
const { Job, User } = require('../models');

async function listJobs(req, res, next) {
  try {
    const { search, location, jobType, page = 1, limit = 6 } = req.query;
    const safePage = Math.max(parseInt(page) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit) || 6, 1), 50);
    const where = { status: 'open' };

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
        { skills: { [Op.like]: `%${search}%` } }
      ];
    }
    if (location) where.location = { [Op.like]: `%${location}%` };
    if (jobType) where.jobType = jobType;

    const result = await Job.findAndCountAll({
      where,
      include: [{ model: User, as: 'employer', attributes: ['id', 'name', 'companyName'] }],
      order: [['createdAt', 'DESC']],
      limit: safeLimit,
      offset: (safePage - 1) * safeLimit
    });

    res.json({
      jobs: result.rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: result.count,
        totalPages: Math.ceil(result.count / safeLimit)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getJob(req, res, next) {
  try {
    const job = await Job.findByPk(req.params.id, {
      include: [{ model: User, as: 'employer', attributes: ['id', 'name', 'companyName'] }]
    });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (err) {
    next(err);
  }
}

async function mine(req, res, next) {
  try {
    const jobs = await Job.findAll({
      where: { employerId: req.user.id },
      include: [{ model: User, as: 'employer', attributes: ['id', 'name', 'companyName'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(jobs);
  } catch (err) {
    next(err);
  }
}

async function createJob(req, res, next) {
  try {
    const required = ['title', 'description', 'company', 'location'];
    for (const field of required) {
      if (!req.body[field]) return res.status(400).json({ message: `${field} is required` });
    }

    const job = await Job.create({ ...req.body, employerId: req.user.id });
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
}

async function updateJob(req, res, next) {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (req.user.role !== 'admin' && job.employerId !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit your own jobs' });
    }

    const allowed = ['title', 'description', 'company', 'location', 'jobType', 'experience', 'salaryMin', 'salaryMax', 'skills', 'status'];
    const updates = {};
    allowed.forEach(key => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    await job.update(updates);
    res.json(job);
  } catch (err) {
    next(err);
  }
}

async function deleteJob(req, res, next) {
  try {
    const job = await Job.findByPk(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (req.user.role !== 'admin' && job.employerId !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete your own jobs' });
    }

    await job.destroy();
    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    next(err);
  }
}

module.exports = { listJobs, getJob, mine, createJob, updateJob, deleteJob };
