const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const { authenticateToken } = require('../middleware/auth');

// Get all purchase orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    let query = {};
    
    // If user is not admin, only show orders they created or are assigned to
    if (req.user.role !== 'ADMIN') {
      query = {
        $or: [
          { createdBy: req.user.userId },
          { assignee: req.user.userId }
        ]
      };
    }

    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('vendorId', 'name')
      .populate('items.medicineId', 'name unit')
      .populate('createdBy', 'username')
      .populate('assignee', 'username')
      .sort({ createdAt: -1 });
    res.json(purchaseOrders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ message: 'Error fetching purchase orders' });
  }
});

// Create a new purchase order (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { vendorId, items, assigneeId } = req.body;

    // Validate required fields
    if (!vendorId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Vendor and at least one item are required' });
    }

    // Create new purchase order
    const purchaseOrder = new PurchaseOrder({
      vendorId,
      items,
      createdBy: req.user.userId,
      assignee: assigneeId,
      status: 'pending'
    });

    await purchaseOrder.save();

    // Populate the response with vendor and medicine details
    const populatedOrder = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('vendorId', 'name')
      .populate('items.medicineId', 'name unit')
      .populate('createdBy', 'username')
      .populate('assignee', 'username');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ message: 'Error creating purchase order' });
  }
});

// Update purchase order status (admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { status } = req.body;
    const { id } = req.params;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const purchaseOrder = await PurchaseOrder.findOneAndUpdate(
      { _id: id },
      { status },
      { new: true }
    )
    .populate('vendorId', 'name')
    .populate('items.medicineId', 'name unit')
    .populate('createdBy', 'username')
    .populate('assignee', 'username');

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    res.status(500).json({ message: 'Error updating purchase order status' });
  }
});

// Delete a purchase order (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findOneAndDelete({
      _id: id,
      status: 'pending' // Only allow deletion of pending orders
    });

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found or cannot be deleted' });
    }

    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    console.error('Error deleting purchase order:', error);
    res.status(500).json({ message: 'Error deleting purchase order' });
  }
});

module.exports = router; 