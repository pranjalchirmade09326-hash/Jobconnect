const mysql = require("mysql2/promise");

const poolConfig = process.env.MYSQL_ADDON_URI || process.env.DATABASE_URL
  ? (process.env.MYSQL_ADDON_URI || process.env.DATABASE_URL)
  : {
      host: process.env.DB_HOST || process.env.MYSQL_ADDON_HOST || "localhost",
      port: Number(process.env.DB_PORT || process.env.MYSQL_ADDON_PORT || 3306),
      user: process.env.DB_USER || process.env.MYSQL_ADDON_USER,
      password: process.env.DB_PASSWORD || process.env.MYSQL_ADDON_PASSWORD,
      database: process.env.DB_NAME || process.env.MYSQL_ADDON_DB,
      waitForConnections: true,
      connectionLimit: 5
    };

const pool = mysql.createPool(poolConfig);

module.exports = { pool };