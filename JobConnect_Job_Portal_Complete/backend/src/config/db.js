require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'jobconnect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initDB() {
  const connection = await pool.getConnection();
  try {
    // 1. Users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('job_seeker', 'employer', 'admin') NOT NULL DEFAULT 'job_seeker',
        phone VARCHAR(20),
        skills VARCHAR(500),
        companyName VARCHAR(150),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_email (email)
      ) ENGINE=InnoDB;
    `);

    // 2. Jobs table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        company VARCHAR(150) NOT NULL,
        location VARCHAR(100) NOT NULL,
        jobType ENUM('Full-time', 'Part-time', 'Internship', 'Contract') DEFAULT 'Full-time',
        experience VARCHAR(100),
        salaryMin INT,
        salaryMax INT,
        skills VARCHAR(500),
        status ENUM('open', 'closed') DEFAULT 'open',
        employerId INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_jobs_employerId (employerId),
        INDEX idx_jobs_status (status),
        INDEX idx_jobs_location (location)
      ) ENGINE=InnoDB;
    `);

    // 3. Applications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        status ENUM('applied', 'shortlisted', 'rejected', 'hired') DEFAULT 'applied',
        coverLetter TEXT,
        jobId INT NOT NULL,
        seekerId INT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_apps_jobId (jobId),
        INDEX idx_apps_seekerId (seekerId),
        UNIQUE KEY uq_job_seeker (jobId, seekerId)
      ) ENGINE=InnoDB;
    `);

    console.log('Database tables verified successfully.');
  } finally {
    connection.release();
  }
}

module.exports = { pool, initDB };
