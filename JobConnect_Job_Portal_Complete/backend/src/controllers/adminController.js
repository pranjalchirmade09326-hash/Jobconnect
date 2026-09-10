const { User, Job, Application, sequelize } = require('../models');

async function dashboard(req, res, next) {
  try {
    const [users, jobs, applications, employers, seekers] = await Promise.all([
      User.count(),
      Job.count(),
      Application.count(),
      User.count({ where: { role: 'employer' } }),
      User.count({ where: { role: 'job_seeker' } })
    ]);
    res.json({ users, jobs, applications, employers, seekers });
  } catch (err) {
    next(err);
  }
}

async function users(req, res, next) {
  try {
    const rows = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']]
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const user = await User.findByPk(req.params.id, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.id === req.user.id) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Admin cannot delete the current account' });
    }

    const jobs = await Job.findAll({ where: { employerId: user.id }, transaction });
    const jobIds = jobs.map(j => j.id);

    if (jobIds.length) {
      await Application.destroy({ where: { jobId: jobIds }, transaction });
      await Job.destroy({ where: { id: jobIds }, transaction });
    }
    await Application.destroy({ where: { seekerId: user.id }, transaction });
    await user.destroy({ transaction });

    await transaction.commit();
    res.json({ message: 'User and related records deleted successfully' });
  } catch (err) {
    await transaction.rollback();
    next(err);
  }
}

module.exports = { dashboard, users, deleteUser };
