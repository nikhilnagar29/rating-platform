// backend/utils/registerAdmin.js
import { db } from '../config/db.js';
import bcrypt from 'bcryptjs';

async function create_user(name , email , password , address , role){
    try {
        // Check if admin already exists
        const existing = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
          console.log(`ℹ️ ${role} already exists: ${existing.rows[0].email}`);
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
    
        console.log(`✅ ${role} created successfully!`);
      } catch (err) {
        console.error('Error creating admin:', err.message);
      }
}

export const registerAdmin = async () => {
  const name = 'admin';
  const email = 'admin@og.com';
  const password = 'admin@123';
  const address = 'Central Admin Office, City 123';
  const role = 'admin';
 
  create_user('admin1' , 'admin@og.com' , 'admin@123' , 'Central Admin Office, City 123' ,'admin' )
  create_user('user1' , 'user56@og.com' , 'user@123' , 'Central Admin Office, City 123' ,'normal_user' )
  create_user('owener1' , 'owener1@og.com' , 'owener@123' , 'Central Admin Office, City 123' ,'store_owner' )
  
};
