const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');
const Sale = require('../models/Sale');
const Medicine = require('../models/Medicine');
const mongoose = require('mongoose');

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
router.post('/', authenticateToken, upload.single('prescriptionImage'), async (req, res) => {
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
    
    // Validate required fields
    if (!saleData.customer || !saleData.items || !Array.isArray(saleData.items) || saleData.items.length === 0) {
      return res.status(400).json({ message: 'Customer and at least one medicine item are required' });
    }

    // Calculate totals
    let totalAmount = 0;
    for (const item of saleData.items) {
      if (!item.medicineId || !item.quantity || !item.price) {
        return res.status(400).json({ message: 'Each item must have medicineId, quantity, and price' });
      }
      item.subtotal = item.quantity * item.price;
      totalAmount += item.subtotal;
    }

    saleData.totalAmount = totalAmount;
    saleData.finalAmount = totalAmount - (saleData.discount || 0);

    // Set default payment type if not provided
    if (!saleData.paymentType) {
      saleData.paymentType = 'CASH';
    }

    // Create and save sale record
    const sale = new Sale(saleData);
    
    // Update medicine stock in a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Save the sale
      await sale.save({ session });

      // Update medicine stock
      for (const item of saleData.items) {
        const medicine = await Medicine.findById(item.medicineId).session(session);
        if (!medicine) {
          throw new Error(`Medicine with ID ${item.medicineId} not found`);
        }
        if (medicine.stock < item.quantity) {
          throw new Error(`Insufficient stock for medicine ${medicine.name}`);
        }
        medicine.stock -= item.quantity;
        await medicine.save({ session });
      }

      await session.commitTransaction();
      res.status(201).json(sale);
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (err) {
    console.error('Error creating sale:', err.message);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error creating sale', error: err.message });
  }
});

// @route   GET api/sales
// @desc    Get all sales
// @access  Private (Admin only for all sales, users see only their sales)
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show sales created by the user
    if (req.user.role !== 'ADMIN') {
      query.createdBy = req.user.id;
    }
    
    const sales = await Sale.find(query)
      .populate('createdBy', 'username')
      .populate('items.medicineId')  // Also populate medicine details
      .sort({ createdAt: -1 });  // Sort by most recent first
      
    res.json(sales);
  } catch (err) {
    console.error('Error fetching sales:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/sales/stats/total
// @desc    Get total sales amount and count
// @access  Private (Admin sees all sales, Viewer sees their own)
router.get('/stats/total', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show sales created by the user
    if (req.user.role !== 'ADMIN') {
      query.createdBy = req.user.id;
    }
    
    const result = await Sale.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalCount: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      totalRevenue: result.length > 0 ? result[0].totalRevenue : 0,
      totalCount: result.length > 0 ? result[0].totalCount : 0
    });
  } catch (err) {
    console.error('Error getting sales statistics:', err.message);
    res.status(500).json({ message: 'Error getting sales statistics' });
  }
});

// @route   GET api/sales/stats/daily
// @desc    Get daily sales statistics
// @access  Private (Admin only)
router.get('/stats/daily', authenticateToken, async (req, res) => {
  // Only admin can access stats
  if (req.user.role !== 'ADMIN') {
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
router.get('/customer/:name', authenticateToken, async (req, res) => {
  try {
    let query = { 
      customerName: { $regex: req.params.name, $options: 'i' } 
    };
    
    // If not admin, only show sales created by the user
    if (req.user.role !== 'ADMIN') {
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
router.get('/history', authenticateToken, async (req, res) => {
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
router.get('/credit', authenticateToken, async (req, res) => {
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
router.get('/stats/receivables', authenticateToken, async (req, res) => {
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
router.get('/stats/total', authenticateToken, async (req, res) => {
    try {
        const totalCount = await Sale.countDocuments();
        
        // Calculate total revenue
        const salesAggregate = await Sale.aggregate([
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$totalAmount' }
            }
          }
        ]);
        
        const totalRevenue = salesAggregate.length > 0 ? salesAggregate[0].totalRevenue : 0;
        
        res.json({
          totalCount,
          totalRevenue
        });
    } catch (err) {
        console.error('Error getting sales stats:', err);
        res.status(500).json({ message: 'Error getting sales statistics' });
    }
});

// @route   GET api/sales/:id
// @desc    Get sale by ID
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('createdBy', 'username');
    
    if (!sale) {
      return res.status(404).json({ msg: 'Sale not found' });
    }
    
    // If not admin and not creator, deny access
    if (req.user.role !== 'ADMIN' && sale.createdBy.toString() !== req.user.id) {
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
router.delete('/:id', authenticateToken, async (req, res) => {
  // Only admin can delete sales
  if (req.user.role !== 'ADMIN') {
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

// Update sale payment
router.put('/:id/payment', authenticateToken, async (req, res) => {
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

// @route   GET api/sales/creditors
// @desc    Get list of creditors with their due amounts
// @access  Private
router.get('/creditors', authenticateToken, async (req, res) => {
  try {
    const creditors = await Sale.aggregate([
      {
        $match: {
          paymentType: 'CREDIT',
          dueAmount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: {
            customer: '$customer',
            phoneNumber: '$customerPhone'
          },
          totalDue: { $sum: '$dueAmount' },
          lastPurchaseDate: { $max: '$createdAt' },
          salesCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          customer: '$_id.customer',
          phoneNumber: '$_id.phoneNumber',
          totalDue: 1,
          lastPurchaseDate: 1,
          salesCount: 1
        }
      },
      {
        $sort: { totalDue: -1 }
      }
    ]);

    res.json({ creditors });
  } catch (err) {
    console.error('Error fetching creditors:', err);
    res.status(500).json({ message: 'Error fetching creditors' });
  }
});

module.exports = router; 