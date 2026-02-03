import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getPool } from '../db/pool.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { sendVerificationEmail } from '../services/emailService.js';

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const pool = getPool();
    const passwordHash = await bcrypt.hash(password, 10);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24); // 24 hours expiration

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, email_verified, email_verification_token, email_verification_token_expires) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id, email, name, email_verified`,
      [email, passwordHash, name || email, false, verificationToken, tokenExpires]
    );

    const user = result.rows[0];

    // Send verification email (non-blocking)
    sendVerificationEmail(email, user.name, verificationToken).catch(err => {
      console.error('Failed to send verification email:', err);
      // Don't fail registration if email fails
    });

    // Generate token (user can login but with limited access until verified)
    const token = generateToken(user.id, user.email);

    res.status(201).json({ 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        email_verified: user.email_verified 
      }, 
      token,
      message: 'Registration successful. Please check your email to verify your account.'
    });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    const errorMessage = error.message || 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    let pool;
    try {
      pool = getPool();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({ 
        error: 'Database connection failed. Please check your environment variables.' 
      });
    }

    const result = await pool.query(
      'SELECT id, email, password_hash, name FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.email);

    // Get email_verified status
    const userResult = await pool.query(
      'SELECT email_verified FROM users WHERE id = $1',
      [user.id]
    );

    res.json({
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        email_verified: userResult.rows[0]?.email_verified || false
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    // Check if it's a database connection error
    if (error.code === 'ECONNREFUSED' || error.code === '28P01' || error.message?.includes('password authentication')) {
      return res.status(500).json({ 
        error: 'Database connection failed. Please check your database configuration.' 
      });
    }
    const errorMessage = error.message || 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    let pool;
    try {
      pool = getPool();
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return res.status(500).json({ 
        error: 'Database connection failed. Please check your environment variables.' 
      });
    }

    const result = await pool.query(
      'SELECT id, email, name, email_verified FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({ user });
  } catch (error) {
    console.error('Get user profile error:', error);
    const errorMessage = error.message || 'Internal server error';
    res.status(500).json({ error: errorMessage });
  }
});

// Verify email
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const pool = getPool();
    const result = await pool.query(
      `SELECT id, email, name, email_verified, email_verification_token_expires 
       FROM users 
       WHERE email_verification_token = $1`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    const user = result.rows[0];

    // Check if already verified
    if (user.email_verified) {
      return res.status(400).json({ 
        error: 'Email already verified',
        message: 'Your email has already been verified.'
      });
    }

    // Check if token expired
    if (new Date() > new Date(user.email_verification_token_expires)) {
      return res.status(400).json({ 
        error: 'Verification token expired',
        message: 'This verification link has expired. Please request a new one.'
      });
    }

    // Verify email
    await pool.query(
      `UPDATE users 
       SET email_verified = true, 
           email_verification_token = NULL, 
           email_verification_token_expires = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [user.id]
    );

    res.json({ 
      success: true,
      message: 'Email verified successfully! You now have full access to the platform.'
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Resend verification email
router.post('/resend-verification', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const pool = getPool();

    const result = await pool.query(
      'SELECT id, email, name, email_verified FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ 
        error: 'Email already verified',
        message: 'Your email is already verified.'
      });
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 24);

    await pool.query(
      `UPDATE users 
       SET email_verification_token = $1, 
           email_verification_token_expires = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [verificationToken, tokenExpires, userId]
    );

    // Send verification email
    const emailSent = await sendVerificationEmail(user.email, user.name, verificationToken);

    if (!emailSent) {
      return res.status(500).json({ 
        error: 'Failed to send verification email',
        message: 'Please try again later or contact support.'
      });
    }

    res.json({ 
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
