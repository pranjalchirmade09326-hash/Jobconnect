const express = require('express');
const router = express.Router();

const { register, login } = require('../controllers/authController');
const jobs = require('../controllers/jobController');
const applications = require('../controllers/applicationController');
const admin = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.post('/auth/register', register);
router.post('/auth/login', login);

// Specific route before /:id to avoid "employer" being treated as a job ID.
router.get('/jobs/employer/mine', protect, authorize('employer'), jobs.mine);
router.get('/jobs', jobs.listJobs);
router.get('/jobs/:id', jobs.getJob);
router.post('/jobs', protect, authorize('employer'), jobs.createJob);
router.put('/jobs/:id', protect, authorize('employer', 'admin'), jobs.updateJob);
router.delete('/jobs/:id', protect, authorize('employer', 'admin'), jobs.deleteJob);

router.post('/applications/:jobId', protect, authorize('job_seeker'), applications.apply);
router.get('/applications/my', protect, authorize('job_seeker'), applications.myApplications);
router.get('/applications/employer/:jobId', protect, authorize('employer', 'admin'), applications.jobApplicants);
router.patch('/applications/:id/status', protect, authorize('employer', 'admin'), applications.updateStatus);

router.get('/admin/dashboard', protect, authorize('admin'), admin.dashboard);
router.get('/admin/users', protect, authorize('admin'), admin.users);
router.delete('/admin/users/:id', protect, authorize('admin'), admin.deleteUser);

module.exports = router;
