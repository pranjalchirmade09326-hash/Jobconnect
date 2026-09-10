require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./src/models');
const routes = require('./src/routes/routes');
const { notFound, errorHandler } = require('./src/middleware/errorHandler');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'JobConnect API' });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    app.listen(PORT, () => console.log(`JobConnect API running on http://localhost:${PORT}`));
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
}

start();
