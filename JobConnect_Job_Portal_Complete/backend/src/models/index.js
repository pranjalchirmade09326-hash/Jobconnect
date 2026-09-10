const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(150), allowNull: false, unique: true },
  password: { type: DataTypes.STRING(255), allowNull: false },
  role: {
    type: DataTypes.ENUM('job_seeker', 'employer', 'admin'),
    allowNull: false,
    defaultValue: 'job_seeker'
  },
  phone: DataTypes.STRING(20),
  skills: DataTypes.STRING(500),
  companyName: DataTypes.STRING(150)
}, {
  tableName: 'users',
  indexes: [{ unique: true, fields: ['email'] }]
});

const Job = sequelize.define('Job', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  title: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  company: { type: DataTypes.STRING(150), allowNull: false },
  location: { type: DataTypes.STRING(100), allowNull: false },
  jobType: {
    type: DataTypes.ENUM('Full-time', 'Part-time', 'Internship', 'Contract'),
    defaultValue: 'Full-time'
  },
  experience: DataTypes.STRING(100),
  salaryMin: DataTypes.INTEGER,
  salaryMax: DataTypes.INTEGER,
  skills: DataTypes.STRING(500),
  status: {
    type: DataTypes.ENUM('open', 'closed'),
    defaultValue: 'open'
  },
  employerId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'jobs',
  indexes: [
    { fields: ['employerId'] },
    { fields: ['status'] },
    { fields: ['location'] }
  ]
});

const Application = sequelize.define('Application', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  status: {
    type: DataTypes.ENUM('applied', 'shortlisted', 'rejected', 'hired'),
    defaultValue: 'applied'
  },
  coverLetter: DataTypes.TEXT,
  jobId: { type: DataTypes.INTEGER, allowNull: false },
  seekerId: { type: DataTypes.INTEGER, allowNull: false }
}, {
  tableName: 'applications',
  indexes: [
    { fields: ['jobId'] },
    { fields: ['seekerId'] },
    { unique: true, fields: ['jobId', 'seekerId'] }
  ]
});

User.hasMany(Job, { foreignKey: 'employerId', as: 'jobs', onDelete: 'CASCADE' });
Job.belongsTo(User, { foreignKey: 'employerId', as: 'employer' });

User.hasMany(Application, { foreignKey: 'seekerId', as: 'applications', onDelete: 'CASCADE' });
Application.belongsTo(User, { foreignKey: 'seekerId', as: 'seeker' });

Job.hasMany(Application, { foreignKey: 'jobId', as: 'applications', onDelete: 'CASCADE' });
Application.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

module.exports = { sequelize, User, Job, Application };
