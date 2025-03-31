import express from 'express';
import User from '../models/User';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Fetching all users...`);
    const users = await User.find({}, '-password'); // Exclude password field
    console.debug(`[${new Date().toISOString()}] Found ${users.length} users:`, JSON.stringify(users, null, 2));
    return res.json(users);
  } catch (error) {
    console.debug(`[${new Date().toISOString()}] Error fetching users:`, error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router; 