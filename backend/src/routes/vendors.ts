import express from 'express';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    res.json({ message: 'Vendors route working' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 