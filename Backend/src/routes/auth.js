import { Router } from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { sendOtpEmail } from '../services/email.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

router.post('/send-otp', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required.' });

    // Check if user already exists and is verified
    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length > 0 && existingUsers[0].is_verified) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const otp_expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    if (existingUsers.length > 0) {
      // update unverified user
      await db.update(users).set({ name, otp, otp_expiry }).where(eq(users.email, email));
    } else {
      // create new user with a dummy password since password comes later
      await db.insert(users).values({ name, email, password: '', otp, otp_expiry });
    }

    // Attempt to send email, but don't fail hard if email service isn't setup
    try {
      await sendOtpEmail(email, name, otp);
    } catch (e) {
      console.log('Skipping email send failure for development.');
      console.log(`[DEVELOPMENT] Your OTP is: ${otp}`);
    }

    res.json({ message: 'OTP sent successfully. Please check your email.' });
  } catch (error) {
    console.error('Send OTP Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) return res.status(400).json({ error: 'Email, OTP, and password are required.' });

    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length === 0) return res.status(404).json({ error: 'User not found. Request OTP first.' });

    const user = existingUsers[0];
    if (user.is_verified) return res.status(400).json({ error: 'User is already registered.' });

    if (user.otp !== otp) return res.status(400).json({ error: 'Invalid OTP.' });
    if (new Date() > new Date(user.otp_expiry)) return res.status(400).json({ error: 'OTP has expired.' });

    // Store password in plain text as per requirements
    await db.update(users).set({
      password,
      is_verified: true,
      otp: null,
      otp_expiry: null
    }).where(eq(users.email, email));

    res.json({ message: 'Registration successful. You can now login.' });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const existingUsers = await db.select().from(users).where(eq(users.email, email));
    if (existingUsers.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });

    const user = existingUsers[0];
    if (!user.is_verified) return res.status(401).json({ error: 'Please verify your email first.' });

    if (user.password !== password) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: false, // For easier local testing as per requirements
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ name: user.name, email: user.email, role: user.role, token });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully.' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ name: req.user.name, email: req.user.email, role: req.user.role });
});

export default router;
