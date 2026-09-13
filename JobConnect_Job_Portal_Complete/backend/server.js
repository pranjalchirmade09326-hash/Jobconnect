require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { pool, initDB } = require('./src/config/db');
const routes = require('./src/routes/routes');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'JobConnect API is running',
    version: '1.0.0'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'JobConnect API' });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL connected successfully.');
    connection.release();

    await initDB();

    const server = app.listen(PORT, () => console.log(`JobConnect API running on http://localhost:${PORT}`));
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Another backend server process is already running.`);
        process.exit(1);
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

start();
