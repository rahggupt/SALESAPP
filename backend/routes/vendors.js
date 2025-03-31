const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const VendorTransaction = require('../models/VendorTransaction');
const { authenticateToken } = require('../middleware/auth');

// Get all vendors
router.get('/', authenticateToken, async (req, res) => {
    try {
        const vendors = await Vendor.find().sort({ name: 1 });
        res.json(vendors);
    } catch (error) {
        console.error('Error fetching vendors:', error);
        res.status(500).json({ message: 'Error fetching vendors' });
    }
});

// Get vendor summary
router.get('/summary', authenticateToken, async (req, res) => {
    try {
        const totalVendors = await Vendor.countDocuments();
        const activeVendors = await Vendor.countDocuments({ isActive: true });
        
        // Get vendors with dues
        const vendorsWithDues = await VendorTransaction.aggregate([
            {
                $match: { dueAmount: { $gt: 0 } }
            },
            {
                $group: {
                    _id: '$vendor',
                    totalDue: { $sum: '$dueAmount' }
                }
            }
        ]);

        res.json({
            total: totalVendors,
            active: activeVendors,
            withDues: vendorsWithDues.length
        });
    } catch (error) {
        console.error('Error getting vendor summary:', error);
        res.status(500).json({ message: 'Error getting vendor summary' });
    }
});

// Get vendor count for dashboard
router.get('/stats/count', authenticateToken, async (req, res) => {
    try {
        const count = await Vendor.countDocuments();
        res.json({ count });
    } catch (error) {
        console.error('Error counting vendors:', error);
        res.status(500).json({ message: 'Error counting vendors' });
    }
});

// Get total payables
router.get('/stats/payables', authenticateToken, async (req, res) => {
    try {
        const transactions = await VendorTransaction.find();
        const total = transactions.reduce((acc, curr) => acc + curr.dueAmount, 0);
        res.json({ total });
    } catch (error) {
        console.error('Error calculating payables:', error);
        res.status(500).json({ message: 'Error calculating payables' });
    }
});

// Get vendor transactions
router.get('/:id/transactions', authenticateToken, async (req, res) => {
    try {
        const transactions = await VendorTransaction.find({ vendor: req.params.id })
            .populate('medicine')
            .sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching transactions' });
    }
});

// Get vendor by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const vendor = await Vendor.findById(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        res.json(vendor);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching vendor' });
    }
});

// Add vendor transaction
router.post('/:id/transactions', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const transaction = new VendorTransaction({
            vendor: req.params.id,
            ...req.body
        });
        await transaction.save();
        res.status(201).json(transaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update vendor transaction
router.put('/transactions/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const transaction = await VendorTransaction.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.json(transaction);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Create new vendor (admin only)
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const vendor = new Vendor(req.body);
        await vendor.save();
        res.status(201).json(vendor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update vendor (admin only)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const vendor = await Vendor.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        res.json(vendor);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete vendor (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const vendor = await Vendor.findByIdAndDelete(req.params.id);
        if (!vendor) {
            return res.status(404).json({ message: 'Vendor not found' });
        }
        res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 