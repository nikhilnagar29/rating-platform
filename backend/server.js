const { Pool } = require('pg');
const express = require('express');

const app = express();
const PORT = process.env.PORT || 5001;

let pool;

async function connectDB(retries = 10, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      pool = new Pool({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
      });
      await pool.query('SELECT 1'); // test query
      console.log('✅ Connected to PostgreSQL');
      return;
    } catch (err) {
      console.error(`❌ Database not ready (attempt ${i + 1})`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  process.exit(1);
}

(async () => {
  await connectDB();
  app.get('/health', (req, res) => res.json({ message: 'Server is running!' }));
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
})();
