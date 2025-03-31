import express from 'express';
import Medicine from '../models/Medicine';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all medicines with pagination and filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Fetching medicines with params:`, req.query);
    
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

    // Build query
    const query: any = { isActive: !archived };
    console.debug(`[${new Date().toISOString()}] Built query:`, query);
    
    // Add search filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (composition) {
      query.composition = { $regex: composition, $options: 'i' };
    }
    
    if (category) {
      query.category = category;
    }

    // Build sort object
    const sort: any = {};
    sort[sortField as string] = sortDirection === 'desc' ? -1 : 1;
    console.debug(`[${new Date().toISOString()}] Sort object:`, sort);

    // Execute query with pagination
    const skip = (Number(page) - 1) * Number(limit);
    console.debug(`[${new Date().toISOString()}] Executing query with skip: ${skip}, limit: ${limit}`);
    
    const medicines = await Medicine.find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));
    
    console.debug(`[${new Date().toISOString()}] Found ${medicines.length} medicines`);

    // Get total count for pagination
    const total = await Medicine.countDocuments(query);
    const totalPages = Math.ceil(total / Number(limit));
    console.debug(`[${new Date().toISOString()}] Total medicines: ${total}, Total pages: ${totalPages}`);

    // Get unique categories
    const categories = await Medicine.distinct('category');
    console.debug(`[${new Date().toISOString()}] Found ${categories.length} categories`);

    const response = {
      medicines,
      total,
      totalPages,
      currentPage: Number(page),
      categories
    };
    
    console.debug(`[${new Date().toISOString()}] Sending response:`, JSON.stringify(response, null, 2));
    res.json(response);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching medicines:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new medicine
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Creating new medicine:`, req.body);
    
    const medicine = new Medicine(req.body);
    await medicine.save();
    
    console.debug(`[${new Date().toISOString()}] Medicine created successfully:`, medicine);
    res.status(201).json(medicine);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error creating medicine:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Archive medicine
router.put('/:id/archive', authenticateToken, async (req, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Archiving medicine:`, req.params.id);
    
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    console.debug(`[${new Date().toISOString()}] Medicine archived successfully:`, medicine);
    res.json(medicine);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error archiving medicine:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unarchive medicine
router.put('/:id/unarchive', authenticateToken, async (req, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Unarchiving medicine:`, req.params.id);
    
    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    console.debug(`[${new Date().toISOString()}] Medicine unarchived successfully:`, medicine);
    res.json(medicine);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error unarchiving medicine:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unique compositions
router.get('/compositions', authenticateToken, async (_req, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Fetching unique compositions...`);
    const compositions = await Medicine.distinct('composition');
    console.debug(`[${new Date().toISOString()}] Found ${compositions.length} unique compositions`);
    res.json(compositions);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching compositions:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unique categories
router.get('/categories', authenticateToken, async (_req, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Fetching unique categories...`);
    const categories = await Medicine.distinct('category');
    console.debug(`[${new Date().toISOString()}] Found ${categories.length} unique categories`);
    res.json(categories);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching categories:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get medicine statistics
router.get('/stats/count', authenticateToken, async (_req, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Fetching medicine statistics`);
    
    const totalMedicines = await Medicine.countDocuments();
    const lowStockMedicines = await Medicine.countDocuments({ stock: { $lt: 10 } });
    const outOfStockMedicines = await Medicine.countDocuments({ stock: 0 });
    
    console.debug(`[${new Date().toISOString()}] Statistics:`, {
      total: totalMedicines,
      lowStock: lowStockMedicines,
      outOfStock: outOfStockMedicines
    });
    
    res.json({
      total: totalMedicines,
      lowStock: lowStockMedicines,
      outOfStock: outOfStockMedicines
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching medicine stats:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 