import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js'; // Import the DB connection
import dotenv from 'dotenv';
dotenv.config();
import * as jdenticon from 'jdenticon';
import { generateIdenticon } from '../utils/identiconUtils.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import createHootfolioIdenticon from '../services/createHootfolioIdenticon.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Register a new user
router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username and password are required' });
  }

  try {
    // Check if username already exists
    const existingUser = await pool.query(
      'SELECT id FROM moonfinder_users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ message: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    createHootfolioIdenticon(username);

    // Generate identicon
    // const identiconSvg = jdenticon.toSvg(username, 200); // Generate a 200x200 SVG
    // const identiconPath = path.join(
    //   __dirname,
    //   '..',
    //   'public',
    //   'identicons',
    //   `${username}.svg`
    // );
    // // const identiconPath = path.join(__dirname, '..', '..', 'client', 'public', 'identicons', `${username}.svg`);
    // console.log(identiconPath);
    // fs.writeFileSync(identiconPath, identiconSvg, 'utf8');

    // Insert new user into the database
    const result = await pool.query(
      'INSERT INTO moonfinder_users (username, password_hash) VALUES ($1, $2) RETURNING id, username', // Use password_hash column
      [username, hashedPassword]
    );

    const user = result.rows[0];

    res.status(201).json({ message: 'User registered successfully', user });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login a user
router.post('/login', async (req, res) => {
  console.log('SERVER SIDE ROUTER LOGIN');
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: 'Username and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM moonfinder_users WHERE username = $1',
      [username]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // Generate Tokens
    const accessToken = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Access token expires in 15 minutes
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET, // Use a separate secret for refresh tokens
      { expiresIn: '7d' } // Refresh token expires in 7 days
    );

    // Store Refresh Token in an HTTP-only Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only allow secure cookies in production
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Send Access Token in the Response
    res.json({ accessToken, user });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

router.post('/refresh-token', (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    // Verify Refresh Token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Issue a New Access Token
    const newAccessToken = jwt.sign(
      { userId: decoded.userId, username: decoded.username },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // Short lifespan
    );

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(403).json({ message: 'Invalid refresh token' });
  }
});

router.post('/logout', (req, res) => {
  // Clear the refresh token cookie
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.json({ message: 'Logged out successfully' });
});

// FOR REFRESHING PAGE AND GETTING USER BASED ON SESSION
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1]; // Extract the token from the Bearer header

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await pool.query(
      'SELECT id, username FROM moonfinder_users WHERE id = $1',
      [decoded.userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.rows[0]); // Send user info back to the client
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(403).json({ message: 'Invalid token' });
  }
});

export default router;
