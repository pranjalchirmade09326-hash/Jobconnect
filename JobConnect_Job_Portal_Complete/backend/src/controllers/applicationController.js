const { Application, Job, User } = require('../models');

async function apply(req, res, next) {
  try {
    const job = await Job.findByPk(req.params.jobId);
    if (!job || job.status !== 'open') return res.status(404).json({ message: 'Open job not found' });

    const existing = await Application.findOne({
      where: { jobId: job.id, seekerId: req.user.id }
    });
    if (existing) return res.status(409).json({ message: 'You already applied for this job' });

    const application = await Application.create({
      jobId: job.id,
      seekerId: req.user.id,
      coverLetter: req.body.coverLetter || ''
    });

    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
}

async function myApplications(req, res, next) {
  try {
    const applications = await Application.findAll({
      where: { seekerId: req.user.id },
      include: [{ model: Job, as: 'job' }],
      order: [['createdAt', 'DESC']]
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
}

async function jobApplicants(req, res, next) {
  try {
    const job = await Job.findByPk(req.params.jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.employerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not own this job' });
    }

    const applications = await Application.findAll({
      where: { jobId: job.id },
      include: [{ model: User, as: 'seeker', attributes: ['id', 'name', 'email', 'phone', 'skills'] }],
      order: [['createdAt', 'DESC']]
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const application = await Application.findByPk(req.params.id, {
      include: [{ model: Job, as: 'job' }]
    });
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (application.job.employerId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You do not own this job' });
    }

    const allowed = ['applied', 'shortlisted', 'rejected', 'hired'];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid application status' });
    }

    application.status = req.body.status;
    await application.save();
    res.json(application);
  } catch (err) {
    next(err);
  }
}

module.exports = { apply, myApplications, jobApplicants, updateStatus };
