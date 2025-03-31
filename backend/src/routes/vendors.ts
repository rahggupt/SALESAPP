import express from 'express';
import Vendor from '../models/Vendor';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all vendors
router.get('/', authenticateToken, async (_req, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Fetching all vendors...`);
    const vendors = await Vendor.find().sort({ name: 1 });
    console.debug(`[${new Date().toISOString()}] Found ${vendors.length} vendors`);
    res.json(vendors);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching vendors:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new vendor (admin only)
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Creating new vendor...`);
    
    if (req.user.role !== 'ADMIN') {
      console.debug(`[${new Date().toISOString()}] Access denied: User is not admin`);
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const vendor = new Vendor(req.body);
    await vendor.save();
    
    console.debug(`[${new Date().toISOString()}] Vendor created successfully:`, vendor);
    res.status(201).json(vendor);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error creating vendor:`, error);
    res.status(400).json({ message: error.message || 'Error creating vendor' });
  }
});

// Get vendor summary
router.get('/summary', authenticateToken, async (_req, res) => {
  try {
    console.debug(`[${new Date().toISOString()}] Fetching vendor summary...`);
    const totalVendors = await Vendor.countDocuments();
    const activeVendors = await Vendor.countDocuments({ isActive: true });
    
    console.debug(`[${new Date().toISOString()}] Found ${totalVendors} total vendors, ${activeVendors} active`);
    res.json({
      total: totalVendors,
      active: activeVendors
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching vendor summary:`, error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 