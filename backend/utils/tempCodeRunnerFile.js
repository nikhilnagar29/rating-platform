// backend/utils/registerAdmin.js
import { db } from '../config/db.js';
import bcrypt from 'bcryptjs';

const registerAdmin = async () => {
  const name = 'admin';
  const email = 'admin@og.com';
  const password = 'admin@123';
  const address = 'Central Admin Office, City 123';
  const role = 'admin';

  try {
    // Check if admin already exists
    const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      console.log('Admin already exists:', existing.rows[0].email);
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert admin
    await db.query(
      `INSERT INTO users (name, email, password_hash, address, role)
       VALUES ($1, $2, $3, $4, $5)`,
      [name, email, password_hash, address, role]
    );

    console.log('✅ Admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password); // For dev only
  } catch (err) {
    console.error('Error creating admin:', err.message);
  } finally {
    process.exit();
  }
};

registerAdmin();