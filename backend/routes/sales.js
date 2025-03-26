const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');

// Set up multer storage for prescription images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/prescriptions');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'sale-prescription-' + uniqueSuffix + ext);
  }
});

// File filter to only allow image uploads
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// @route   POST api/sales
// @desc    Create a new sale
// @access  Private
router.post('/', auth, upload.single('prescriptionImage'), async (req, res) => {
  try {
    // Parse sale data
    const saleData = req.body.saleData ? JSON.parse(req.body.saleData) : req.body;
    
    // Process uploaded prescription image if exists
    if (req.file) {
      saleData.prescriptionImagePath = `/uploads/prescriptions/${req.file.filename}`;
      saleData.prescriptionOriginalFilename = req.file.originalname;
    }
    
    // Add user to sale data
    saleData.createdBy = req.user.id;
    
    // Create sale record
    const sale = new Sale(saleData);
    await sale.save();
    
    // Update medicine stock
    for (const item of saleData.items) {
      await Medicine.findByIdAndUpdate(item.medicineId, {
        $inc: { stock: -item.quantity }
      });
    }
    
    res.status(201).json(sale);
  } catch (err) {
    console.error('Error creating sale:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/sales
// @desc    Get all sales
// @access  Private (Admin only for all sales, users see only their sales)
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show sales created by the user
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }
    
    const sales = await Sale.find(query)
      .populate('createdBy', 'username');
      
    res.json(sales);
  } catch (err) {
    console.error('Error fetching sales:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/sales/stats/total
// @desc    Get total sales amount
// @access  Private (Admin only)
router.get('/stats/total', auth, async (req, res) => {
  // Only admin can access total sales
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admin only.' });
  }
  
  try {
    const result = await Sale.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$total' }
        }
      }
    ]);
    
    const total = result.length > 0 ? result[0].total : 0;
    res.json({ total });
  } catch (err) {
    console.error('Error getting total sales:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/sales/stats/daily
// @desc    Get daily sales statistics
// @access  Private (Admin only)
router.get('/stats/daily', auth, async (req, res) => {
  // Only admin can access stats
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admin only.' });
  }
  
  try {
    // Get start date (default to 7 days ago) and end date (today)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    // Query sales between start and end dates
    const sales = await Sale.find({
      createdAt: { $gte: startDate, $lte: endDate }
    });
    
    // Generate daily stats
    const dailyStats = {};
    
    // Initialize stats for each day
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats[dateStr] = { count: 0, revenue: 0 };
    }
    
    // Populate stats with actual data
    sales.forEach(sale => {
      const dateStr = sale.createdAt.toISOString().split('T')[0];
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].count++;
        dailyStats[dateStr].revenue += sale.total;
      }
    });
    
    res.json(Object.entries(dailyStats).map(([date, stats]) => ({
      date,
      count: stats.count,
      revenue: stats.revenue
    })));
  } catch (err) {
    console.error('Error generating daily stats:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/sales/customer/:name
// @desc    Get sales by customer name (partial match)
// @access  Private
router.get('/customer/:name', auth, async (req, res) => {
  try {
    let query = { 
      customerName: { $regex: req.params.name, $options: 'i' } 
    };
    
    // If not admin, only show sales created by the user
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }
    
    const sales = await Sale.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'username');
      
    res.json(sales);
  } catch (err) {
    console.error('Error searching sales by customer:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/sales/history
// @desc    Get sales history with filters
// @access  Private
router.get('/history', auth, async (req, res) => {
    try {
        const { startDate, endDate, paymentType, paymentStatus } = req.query;
        let query = {};

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (paymentType) {
            query.paymentType = paymentType.toUpperCase();
        }

        if (paymentStatus) {
            query.paymentStatus = paymentStatus.toUpperCase();
        }

        const sales = await Sale.find(query)
            .populate('medicines.medicine')
            .sort({ date: -1 });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales history' });
    }
});

// @route   GET api/sales/credit
// @desc    Get credit sales with filters
// @access  Private
router.get('/credit', auth, async (req, res) => {
    try {
        const { startDate, endDate, paymentStatus } = req.query;
        let query = {
            paymentType: 'CREDIT'
        };

        if (startDate && endDate) {
            query.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        if (paymentStatus && paymentStatus !== 'ALL') {
            query.paymentStatus = paymentStatus;
        }

        const sales = await Sale.find(query)
            .populate('medicines.medicine')
            .sort({ date: -1 });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching credit sales' });
    }
});

// @route   GET api/sales/stats/receivables
// @desc    Get total receivables
// @access  Private
router.get('/stats/receivables', auth, async (req, res) => {
    try {
        const sales = await Sale.find({ paymentType: 'CREDIT' });
        const total = sales.reduce((acc, curr) => acc + curr.dueAmount, 0);
        res.json({ total });
    } catch (error) {
        console.error('Error calculating receivables:', error);
        res.status(500).json({ message: 'Error calculating receivables' });
    }
});

// @route   GET api/sales/stats/total
// @desc    Get total sales
// @access  Private
router.get('/stats/total', auth, async (req, res) => {
    try {
        const sales = await Sale.find();
        const total = sales.reduce((acc, curr) => acc + curr.totalAmount, 0);
        res.json({ total });
    } catch (error) {
        console.error('Error calculating total sales:', error);
        res.status(500).json({ message: 'Error calculating total sales' });
    }
});

// @route   GET api/sales/:id
// @desc    Get sale by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('createdBy', 'username');
    
    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }
    
    // If not admin and not creator, deny access
    if (req.user.role !== 'admin' && sale.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    res.json(sale);
  } catch (err) {
    console.error('Error fetching sale:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Sale not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/sales/:id
// @desc    Delete a sale
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  // Only admin can delete sales
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied. Admin only.' });
  }
  
  try {
    const sale = await Sale.findById(req.params.id);
    
    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }
    
    // Delete prescription image if exists
    if (sale.prescriptionImagePath) {
      const filePath = path.join(__dirname, '..', sale.prescriptionImagePath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Restore medicine stock
    for (const item of sale.items) {
      await Medicine.findByIdAndUpdate(item.medicineId, {
        $inc: { stock: item.quantity }
      });
    }
    
    await sale.remove();
    res.json({ msg: 'Sale removed' });
  } catch (err) {
    console.error('Error deleting sale:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Sale not found' });
    }
    res.status(500).send('Server error');
  }
});

// Get all sales
router.get('/', auth, async (req, res) => {
    try {
        const sales = await Sale.find()
            .populate('medicines.medicine')
            .sort({ date: -1 });
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching sales' });
    }
});

// Update sale payment
router.put('/:id/payment', auth, async (req, res) => {
    try {
        const { amount } = req.body;
        const sale = await Sale.findById(req.params.id);
        
        if (!sale) {
            return res.status(404).json({ message: 'Sale not found' });
        }

        sale.paidAmount += amount;
        sale.dueAmount = sale.totalAmount - sale.paidAmount;
        
        if (sale.paidAmount >= sale.totalAmount) {
            sale.paymentStatus = 'PAID';
        } else if (sale.paidAmount > 0) {
            sale.paymentStatus = 'PARTIAL';
        }

        await sale.save();
        res.json(sale);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

module.exports = router; 