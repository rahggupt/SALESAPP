import express from 'express';
import User from '../models/User';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 