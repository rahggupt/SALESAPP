import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

router.post('/login', async (req, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Login attempt for email: ${req.body.email}`);
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      console.debug(`[${new Date().toISOString()}] Login failed: User not found`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.debug(`[${new Date().toISOString()}] Login failed: Invalid password`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    console.debug(`[${new Date().toISOString()}] Login successful for user: ${user.email}`);
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.debug(`[${new Date().toISOString()}] Login error:`, error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Fetching profile for user: ${req.user.userId}`);
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      console.debug(`[${new Date().toISOString()}] Profile not found for user: ${req.user.userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    console.debug(`[${new Date().toISOString()}] Profile fetched successfully for user: ${user.email}`);
    return res.json(user);
  } catch (error) {
    console.debug(`[${new Date().toISOString()}] Profile fetch error:`, error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router; 