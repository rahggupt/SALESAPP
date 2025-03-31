import express from 'express';
import Sale from '../models/Sale';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all sales
router.get('/', async (_req, res) => {
  try {
    const sales = await Sale.find({});
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get total sales amount
router.get('/stats/total', async (_req, res) => {
  try {
    const result = await Sale.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          totalSales: { $sum: 1 }
        }
      }
    ]);

    const stats = result[0] || { totalAmount: 0, totalSales: 0 };
    res.json(stats);
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get daily sales statistics
router.get('/stats/daily', async (_req, res) => {
  try {
    const result = await Sale.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 7 } // Last 7 days
    ]);

    res.json(result);
  } catch (error) {
    console.error('Error fetching daily sales stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sales history
router.get('/history', authenticateToken, async (req, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Fetching sales history...`);
    const { page = 1, limit = 10, sortField = 'createdAt', sortDirection = 'desc' } = req.query;
    
    const sortOptions: any = {};
    sortOptions[sortField as string] = sortDirection === 'asc' ? 1 : -1;

    const sales = await Sale.find()
      .sort(sortOptions)
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .populate('items.medicine', 'name price')
      .populate('soldBy', 'name');

    const total = await Sale.countDocuments();

    console.debug(`[${new Date().toISOString()}] Found ${sales.length} sales`);
    res.json({
      sales,
      total,
      pages: Math.ceil(total / Number(limit)),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching sales history:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 