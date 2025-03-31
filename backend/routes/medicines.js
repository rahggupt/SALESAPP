const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const { authenticateToken } = require('../middleware/auth');
const mongoose = require('mongoose');

// Get all medicines with sorting, pagination, and search
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortField = 'name',
      sortDirection = 'asc',
      search = '',
      composition = '',
      category = '',
      archived = false
    } = req.query;

    // Build search query
    const searchQuery = {
      isArchived: archived === 'true',
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } }
      ]
    };

    // Add composition filter if provided
    if (composition) {
      searchQuery.composition = { $regex: composition, $options: 'i' };
    }

    // Add category filter if provided
    if (category) {
      searchQuery.category = category;
    }

    // Build sort object
    const sortObject = {};
    sortObject[sortField] = sortDirection === 'desc' ? -1 : 1;

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination and sorting
    const medicines = await Medicine.find(searchQuery)
      .sort(sortObject)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Medicine.countDocuments(searchQuery);

    // Get unique categories for filter
    const categories = await Medicine.distinct('category', { isArchived: archived === 'true' });

    res.json({
      medicines,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      categories
    });
  } catch (err) {
    console.error('Error fetching medicines:', err);
    res.status(500).json({ message: 'Error fetching medicines' });
  }
});

// @route   GET api/medicines/stats/count
// @desc    Get total count of medicines and additional stats
// @access  Private
router.get('/stats/count', authenticateToken, async (req, res) => {
  try {
    const count = await Medicine.countDocuments({ isArchived: false });
    
    // Get count of medicines with stock below threshold (e.g., 10)
    const lowStockCount = await Medicine.countDocuments({ 
      isArchived: false,
      stock: { $lt: 10 }
    });
    
    // Get count of medicines expiring within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringCount = await Medicine.countDocuments({
      isArchived: false,
      expiryDate: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      }
    });
    
    res.json({
      count,
      lowStockCount,
      expiringCount
    });
  } catch (error) {
    console.error('Error getting medicine count:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/medicines/categories
// @desc    Get unique categories
// @access  Private
router.get('/categories', authenticateToken, async (req, res) => {
    try {
        const categories = await Medicine.distinct('category', { isArchived: false });
        res.json(categories);
    } catch (error) {
        console.error('Error getting categories:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/medicines/compositions
// @desc    Get unique compositions
// @access  Private
router.get('/compositions', authenticateToken, async (req, res) => {
    try {
        const compositions = await Medicine.distinct('composition', { isArchived: false });
        // Flatten the array of arrays and get unique values
        const uniqueCompositions = [...new Set(compositions.flat())];
        res.json(uniqueCompositions);
    } catch (error) {
        console.error('Error getting compositions:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get medicine statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalCount = await Medicine.countDocuments();
    
    // Get count of medicines with stock below threshold (e.g., 10)
    const lowStockCount = await Medicine.countDocuments({ stock: { $lt: 10 } });
    
    // Get count of medicines expiring within 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const expiringCount = await Medicine.countDocuments({
      expiryDate: {
        $gte: new Date(),
        $lte: thirtyDaysFromNow
      }
    });
    
    res.json({
      totalCount,
      lowStockCount,
      expiringCount
    });
  } catch (err) {
    console.error('Error getting medicine stats:', err);
    res.status(500).json({ message: 'Error getting medicine statistics' });
  }
});

// Get medicines by expiry status
router.get('/expiry', authenticateToken, async (req, res) => {
  try {
    const { filter = 'all', days = 30 } = req.query;
    const today = new Date();
    let query = { isArchived: false };

    switch (filter) {
      case 'expired':
        query.expiryDate = { $lt: today };
        break;
      case 'expiring':
        const daysFromNow = new Date();
        daysFromNow.setDate(daysFromNow.getDate() + parseInt(days));
        query.expiryDate = { 
          $gte: today,
          $lte: daysFromNow
        };
        break;
      case 'all':
      default:
        // No additional date filter needed
        break;
    }

    const medicines = await Medicine.find(query)
      .sort({ expiryDate: 1 })
      .populate('vendor', 'name')
      .select('name description category manufacturer batchNumber expiryDate stock vendor purchasePrice');

    // Group medicines by status
    const result = {
      expired: [],
      expiring: [],
      valid: []
    };

    const daysFromNow = new Date();
    daysFromNow.setDate(daysFromNow.getDate() + parseInt(days));

    medicines.forEach(medicine => {
      const expiryDate = new Date(medicine.expiryDate);
      if (expiryDate < today) {
        result.expired.push(medicine);
      } else if (expiryDate <= daysFromNow) {
        result.expiring.push(medicine);
      } else {
        result.valid.push(medicine);
      }
    });

    res.json({
      medicines: result,
      total: medicines.length,
      filter,
      days
    });
  } catch (err) {
    console.error('Error fetching medicines by expiry:', err);
    res.status(500).json({ message: 'Error fetching medicines', error: err.message });
  }
});

// Get medicine by ID - This should come after all other specific routes
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        res.json(medicine);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add new medicine (admin only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { 
            name, 
            composition, 
            description,
            category, 
            price, 
            currency,
            priceUnit,
            stock, 
            expiryDate, 
            manufacturer, 
            batchNumber,
            requiresPrescription,
            storage,
            vendor,
            purchasePrice,
            paymentStatus,
            paidAmount
        } = req.body;
        
        // Validate required fields
        if (!name || !composition || !category || !price || !stock || !expiryDate || 
            !manufacturer || !batchNumber || !storage || !vendor || !purchasePrice || 
            !paymentStatus || typeof paidAmount !== 'number') {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Validate vendor ID format
        if (!mongoose.Types.ObjectId.isValid(vendor)) {
            return res.status(400).json({ message: 'Invalid vendor ID format' });
        }

        // Validate expiry date format (YYYY-MM)
        if (!expiryDate.match(/^\d{4}-\d{2}$/)) {
            return res.status(400).json({ message: 'Invalid expiry date format. Use YYYY-MM format.' });
        }

        // Calculate due amount based on payment status
        let dueAmount = 0;
        if (paymentStatus === 'DUE') {
            dueAmount = purchasePrice;
        } else if (paymentStatus === 'PARTIAL') {
            dueAmount = purchasePrice - paidAmount;
        }

        // Create new medicine with explicit field assignment
        const medicine = new Medicine({
            name: name.trim(),
            composition: composition,
            description: description || '',
            category: category.trim(),
            price: parseFloat(price),
            currency: currency || 'NPR',
            priceUnit: priceUnit || 'piece',
            stock: parseInt(stock),
            expiryDate: expiryDate, // The schema's setter will handle the date conversion
            manufacturer: manufacturer.trim(),
            batchNumber: batchNumber.trim(),
            requiresPrescription: requiresPrescription || false,
            storage: storage,
            vendor: new mongoose.Types.ObjectId(vendor),
            purchasePrice: parseFloat(purchasePrice),
            paymentStatus: paymentStatus,
            paidAmount: parseFloat(paidAmount),
            dueAmount: parseFloat(dueAmount),
            isArchived: false
        });

        console.log('Creating medicine with data:', medicine.toObject());

        const savedMedicine = await medicine.save();
        res.status(201).json(savedMedicine);
    } catch (error) {
        console.error('Error adding medicine:', error);
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
        }
        res.status(400).json({ message: error.message });
    }
});

// Update medicine (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { expiryDate } = req.body;
        
        // Validate expiry date format if it's being updated
        if (expiryDate && !expiryDate.match(/^\d{4}-\d{2}$/)) {
            return res.status(400).json({ message: 'Invalid expiry date format. Use YYYY-MM format.' });
        }

        const medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        
        res.json(medicine);
    } catch (error) {
        console.error('Error updating medicine:', error);
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ message: 'Validation failed', errors: validationErrors });
        }
        res.status(500).json({ message: error.message });
    }
});

// Delete medicine (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const medicine = await Medicine.findByIdAndDelete(req.params.id);
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        res.json({ message: 'Medicine deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Archive medicine (admin only)
router.put('/:id/archive', authenticateToken, async (req, res) => {
    // Only admin can archive medicines
    if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }

    try {
        const medicine = await Medicine.findById(req.params.id);
        
        if (!medicine) {
            return res.status(404).json({ msg: 'Medicine not found' });
        }

        medicine.isArchived = true;
        await medicine.save();
        
        res.json(medicine);
    } catch (err) {
        console.error('Error archiving medicine:', err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Medicine not found' });
        }
        res.status(500).send('Server error');
    }
});

// Update medicine payment status
router.put('/:id/payment', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { paidAmount, paymentStatus } = req.body;
        const medicine = await Medicine.findById(req.params.id);

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        // Validate payment amount
        if (paidAmount < 0 || paidAmount > medicine.purchasePrice) {
            return res.status(400).json({ message: 'Invalid payment amount' });
        }

        // Update payment using the new method
        await medicine.updatePayment(paidAmount, paymentStatus);

        res.json({
            message: 'Payment status updated successfully',
            medicine
        });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ message: 'Error updating payment status' });
    }
});

// Get medicines by payment status
router.get('/payment/status', authenticateToken, async (req, res) => {
    try {
        const { status } = req.query;
        const query = { isArchived: false };

        if (status) {
            query.paymentStatus = status;
        }

        const medicines = await Medicine.find(query)
            .populate('vendor', 'name')
            .sort({ createdAt: -1 });

        // Calculate total amounts
        const totals = {
            totalPurchasePrice: 0,
            totalPaidAmount: 0,
            totalDueAmount: 0,
            totalProfitMargin: 0
        };

        medicines.forEach(medicine => {
            totals.totalPurchasePrice += medicine.purchasePrice;
            totals.totalPaidAmount += medicine.paidAmount;
            totals.totalDueAmount += medicine.dueAmount;
            totals.totalProfitMargin += medicine.calculateProfitMargin();
        });

        // Calculate averages
        totals.averageProfitMargin = totals.totalProfitMargin / medicines.length;

        res.json({
            medicines,
            totals
        });
    } catch (error) {
        console.error('Error fetching medicines by payment status:', error);
        res.status(500).json({ message: 'Error fetching medicines' });
    }
});

// Get payment history for a medicine
router.get('/:id/payment-history', authenticateToken, async (req, res) => {
    try {
        const medicine = await Medicine.findById(req.params.id)
            .select('paymentHistory lastPaymentDate')
            .populate('vendor', 'name');

        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }

        res.json({
            paymentHistory: medicine.paymentHistory,
            lastPaymentDate: medicine.lastPaymentDate,
            vendorName: medicine.vendor.name
        });
    } catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ message: 'Error fetching payment history' });
    }
});

// Get payment summary
router.get('/payment/summary', authenticateToken, async (req, res) => {
    try {
        const summary = await Medicine.aggregate([
            {
                $match: { isArchived: false }
            },
            {
                $group: {
                    _id: '$paymentStatus',
                    count: { $sum: 1 },
                    totalPurchasePrice: { $sum: '$purchasePrice' },
                    totalPaidAmount: { $sum: '$paidAmount' },
                    totalDueAmount: { $sum: '$dueAmount' }
                }
            }
        ]);

        // Calculate overall totals
        const totals = summary.reduce((acc, curr) => ({
            totalMedicines: acc.totalMedicines + curr.count,
            totalPurchasePrice: acc.totalPurchasePrice + curr.totalPurchasePrice,
            totalPaidAmount: acc.totalPaidAmount + curr.totalPaidAmount,
            totalDueAmount: acc.totalDueAmount + curr.totalDueAmount
        }), {
            totalMedicines: 0,
            totalPurchasePrice: 0,
            totalPaidAmount: 0,
            totalDueAmount: 0
        });

        res.json({
            summary,
            totals
        });
    } catch (error) {
        console.error('Error fetching payment summary:', error);
        res.status(500).json({ message: 'Error fetching payment summary' });
    }
});

module.exports = router; 