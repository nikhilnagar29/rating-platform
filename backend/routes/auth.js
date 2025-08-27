// backend/routes/auth.js
import express from 'express';
import { db } from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// --- Helper function for validating registration data ---
// This function checks the data against the rules from the PDF
const validateRegistrationData = (userData) => {
    const errors = [];

    // Name validation (PDF says Min 2, Max 60 - correcting comment from 20)
    if (!userData.name || typeof userData.name !== 'string' || userData.name.length < 2 || userData.name.length > 60) {
         errors.push('Name is required and must be between 2 and 60 characters.');
    }

    // Email validation (basic check, you might want a more robust library like 'validator')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!userData.email || typeof userData.email !== 'string' || !emailRegex.test(userData.email)) {
        errors.push('A valid email is required.');
    }

    // Address validation (Max 400 characters)
    if (!userData.address || typeof userData.address !== 'string' || userData.address.length > 400) {
         errors.push('Address is required and must be a maximum of 400 characters.');
    }

    // Password validation (8-16 chars, uppercase, special char)
    if (!userData.password || typeof userData.password !== 'string') {
         errors.push('Password is required.');
    } else {
        const minLength = 8;
        const maxLength = 16;
        const hasUpperCase = /[A-Z]/.test(userData.password);
        const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(userData.password);

        if (userData.password.length < minLength || userData.password.length > maxLength) {
            errors.push('Password must be between 8 and 16 characters long.');
        }
        if (!hasUpperCase) {
            errors.push('Password must contain at least one uppercase letter.');
        }
        if (!hasSpecialChar) {
            errors.push('Password must contain at least one special character.');
        }
    }

    // For registration, role is typically fixed or not provided.
    // If provided, it should usually be 'normal_user'.
    // We can ignore role from input for normal user registration or enforce it.
    // Let's enforce it to be 'normal_user' or undefined/ignored for safety.
    // If you specifically need to allow role setting via this endpoint (less common for public signup), adjust logic.
    // For now, we assume normal user signup doesn't accept role or sets it internally.

    return errors; // Return array of errors, empty if valid
};

// POST /api/user/register (or potentially /api/auth/register if moved)
// Takes name, email, password, address in request body
// Role is implicitly set to 'normal_user'
router.post('/register', async (req, res) => {
    const { name, email, password, address } = req.body;
    // Note: Role is not typically accepted from the user for normal signup
    // It's enforced as 'normal_user' on the server side.

    // 1. Validate Input Data
    const validationErrors = validateRegistrationData({ name, email, password, address });
    if (validationErrors.length > 0) {
        return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
    }

    try {
        // 2. Check for Existing User (Email Uniqueness - enforced by DB constraint as well, but good practice to check)
        const existingUserResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUserResult.rows.length > 0) {
            return res.status(400).json({ message: 'User with this email already exists.' });
        }

        // 3. Hash the Password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 4. Insert New User into Database
        // Role is explicitly set to 'normal_user' for this endpoint
        const insertResult = await db.query(
            `INSERT INTO users (name, email, password_hash, address, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, name, email, address, role, created_at`, // Return inserted user data (without password_hash)
            [name, email, hashedPassword, address, 'normal_user'] // Role enforced here
        );

        const newUser = insertResult.rows[0];

        // 5. Respond with Success (Optionally generate and return a JWT token for auto-login)
        // For now, just send success message and user details (excluding sensitive data like password_hash)
         // Consider generating a JWT here if you want the user to be logged in immediately after registration
         // const token = jwt.sign({ id: newUser.id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
         // res.status(201).json({ message: 'User registered successfully.', user: newUser, token });

        res.status(201).json({ message: 'User registered successfully.', user: newUser });

    } catch (error) {
        console.error('Error registering user:', error);

        // Handle specific database errors (e.g., unique violation on email if not caught above)
        if (error.code === '23505') { // Unique violation error code in PostgreSQL
             return res.status(400).json({ message: 'User with this email already exists.' });
        }

        res.status(500).json({ message: 'Internal server error during registration.' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log(email , password) ;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }


    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Return user data and token
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;