// backend/server.js

import { Pool } from 'pg';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';  // Make sure you installed: npm install cors
import authRoutes from './routes/auth.js';
import { registerAdmin } from './utils/registerAdmin.js';
import adminRoutes from './routes/admin.js'; 
import owenerRouter from './routes/owener.js';
import userRouter from './routes/user.js'

dotenv.config();

const app = express();

// ✅ CORS Configuration
const allowedOrigins = [
  'http://localhost:5173', // React app
  'http://localhost:3000', // fallback
];

app.use(cors({
  origin: function (origin, callback) {
    // ✅ Allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true, // 👈 Important for cookies/JWT in headers
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
  ],
}));

// Handle preflight globally if needed
app.options('*', cors()); // Enable preflight for all routes

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/user', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner' , owenerRouter);
app.use('/api/user' , userRouter) ;

// DB Connection
let pool;

async function connectDB(retries = 10, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
        let host = "localhost" ;
        if(i % 2){
            host = process.env.DB_HOST ;
        }
      pool = new Pool({
        host: host ,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
      });
      await pool.query('SELECT 1');
      console.log('✅ Connected to PostgreSQL');
      return;
    } catch (err) {
      console.error(`❌ DB connection failed (attempt ${i + 1}):`, err.message);
      if (i === retries - 1) process.exit(1);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// Export pool
export { pool };

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running!' });
});

// Start server
(async () => {
  await connectDB();

  // 👇 Run once after DB is ready
  await registerAdmin();

  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})();