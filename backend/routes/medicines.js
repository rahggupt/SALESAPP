const express = require('express');
const router = express.Router();
const Medicine = require('../models/Medicine');
const auth = require('../middleware/auth');

// Get all medicines with sorting, pagination, and search
router.get('/', auth, async (req, res) => {
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
// @desc    Get total count of medicines
// @access  Private
router.get('/stats/count', auth, async (req, res) => {
    try {
        const count = await Medicine.countDocuments({ isArchived: false });
        res.json({ count });
    } catch (error) {
        console.error('Error getting medicine count:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/medicines/categories
// @desc    Get unique categories
// @access  Private
router.get('/categories', auth, async (req, res) => {
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
router.get('/compositions', auth, async (req, res) => {
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

// Get medicine by ID
router.get('/:id', auth, async (req, res) => {
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
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // Validate required fields
        const { name, composition, category, price, stock, expiryDate, manufacturer, batchNumber } = req.body;
        
        if (!name || !composition || !category || !price || !stock || !expiryDate || !manufacturer || !batchNumber) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        // Create new medicine
        const medicine = new Medicine({
            name,
            composition,
            description: req.body.description || '',
            category,
            price: parseFloat(price),
            priceUnit: req.body.priceUnit || 'piece',
            stock: parseInt(stock),
            expiryDate: new Date(expiryDate),
            manufacturer,
            batchNumber,
            requiresPrescription: req.body.requiresPrescription || false,
            isArchived: false
        });

        await medicine.save();
        res.status(201).json(medicine);
    } catch (error) {
        console.error('Error adding medicine:', error.message);
        res.status(400).json({ message: error.message });
    }
});

// Update medicine (admin only)
router.put('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const medicine = await Medicine.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if (!medicine) {
            return res.status(404).json({ message: 'Medicine not found' });
        }
        res.json(medicine);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete medicine (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
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

// @route   PUT api/medicines/:id/archive
// @desc    Archive a medicine
// @access  Private (Admin only)
router.put('/:id/archive', auth, async (req, res) => {
    // Only admin can archive medicines
    if (req.user.role !== 'admin') {
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

module.exports = router; 