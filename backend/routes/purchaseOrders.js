const express = require('express');
const router = express.Router();
const PurchaseOrder = require('../models/PurchaseOrder');
const { authenticateToken } = require('../middleware/auth');

// Get all purchase orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const orders = await PurchaseOrder.find()
      .populate('vendorId', 'name')
      .populate('assignee', 'username')
      .sort(sortOptions);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    if (!vendorId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Vendor and at least one item are required' });
    }

    // Validate items
    for (const item of items) {
      if (!item.name || !item.quantity || item.quantity <= 0 || !item.price || item.price < 0) {
        return res.status(400).json({ message: 'Each item must have a valid name, quantity, and price' });
      }
    }

    // Generate order number (PO-YYYYMMDD-XXXX)
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const lastOrder = await PurchaseOrder.findOne({
      orderNumber: new RegExp(`^PO-${dateStr}-`)
    }).sort({ orderNumber: -1 });

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    const orderNumber = `PO-${dateStr}-${sequence.toString().padStart(4, '0')}`;

    // Create new purchase order
    const purchaseOrder = new PurchaseOrder({
      orderNumber,
      vendorId,
      items,
      assignee: assigneeId,
      status: 'pending'
    });

    await purchaseOrder.save();

    // Populate the response with vendor and assignee details
    const populatedOrder = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('vendorId', 'name')
      .populate('assignee', 'username');

    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error('Error creating purchase order:', err);
    res.status(500).json({ message: err.message });
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

    if (!['pending', 'completed', 'cancelled', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be one of: pending, completed, cancelled, archived' });
    }

    // Update the order with status
    const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      { status },
      { 
        new: true,
        runValidators: true 
      }
    ).populate([
      { path: 'vendorId', select: 'name' },
      { path: 'assignee', select: 'username' }
    ]);

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json(updatedOrder);
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

// @route   PATCH api/purchase-orders/:id/archive
// @desc    Archive a purchase order
// @access  Private (Admin only)
router.patch('/:id/archive', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Update the order with status
    const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      { status: 'archived' },
      { 
        new: true,
        runValidators: true 
      }
    ).populate([
      { path: 'vendorId', select: 'name' },
      { path: 'assignee', select: 'username' }
    ]);

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error archiving purchase order:', error);
    res.status(500).json({ message: 'Error archiving purchase order' });
  }
});

// @route   PATCH api/purchase-orders/:id/assignee
// @desc    Update purchase order assignee
// @access  Private (Admin only)
router.patch('/:id/assignee', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { assignee } = req.body;
    const { id } = req.params;

    // Update the order with assignee
    const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      { assignee: assignee || null },
      { 
        new: true,
        runValidators: true 
      }
    ).populate([
      { path: 'vendorId', select: 'name' },
      { path: 'assignee', select: 'username' }
    ]);

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating purchase order assignee:', error);
    res.status(500).json({ message: 'Error updating purchase order assignee' });
  }
});

// @route   PATCH api/purchase-orders/:id/payment
// @desc    Update purchase order payment status
// @access  Private (Admin only)
router.patch('/:id/payment', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { paymentStatus, paidAmount } = req.body;
    const { id } = req.params;

    if (!['PAID', 'PARTIAL', 'DUE'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status. Must be one of: PAID, PARTIAL, DUE' });
    }

    // Update the order with payment status and amount
    const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      { paymentStatus, paidAmount },
      { 
        new: true,
        runValidators: true 
      }
    ).populate([
      { path: 'vendorId', select: 'name' },
      { path: 'assignee', select: 'username' }
    ]);

    if (!updatedOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json(updatedOrder);
  } catch (error) {
    console.error('Error updating purchase order payment:', error);
    res.status(500).json({ message: 'Error updating purchase order payment' });
  }
});

// @route   GET api/purchase-orders/payment/summary
// @desc    Get payment summary for purchase orders
// @access  Private (Admin only)
router.get('/payment/summary', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const orders = await PurchaseOrder.find()
      .populate('vendorId', 'name');

    // Calculate totals
    const summary = {
      totalAmount: 0,
      paidAmount: 0,
      totalDueAmount: 0,
      partialAmount: 0,
      vendors: []
    };

    // Group by vendor
    const vendorTotals = {};

    orders.forEach(order => {
      const orderTotal = order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
      summary.totalAmount += orderTotal;
      summary.paidAmount += order.paidAmount || 0;
      summary.totalDueAmount += (orderTotal - (order.paidAmount || 0));
      if (order.paymentStatus === 'PARTIAL') {
        summary.partialAmount += orderTotal;
      }

      // Add to vendor totals
      if (order.vendorId && order.vendorId.name) {
        if (!vendorTotals[order.vendorId.name]) {
          vendorTotals[order.vendorId.name] = 0;
        }
        vendorTotals[order.vendorId.name] += (orderTotal - (order.paidAmount || 0));
      }
    });

    // Convert vendor totals to array
    summary.vendors = Object.entries(vendorTotals).map(([name, totalDue]) => ({
      name,
      totalDue
    }));

    res.json(summary);
  } catch (error) {
    console.error('Error fetching payment summary:', error);
    res.status(500).json({ message: 'Error fetching payment summary' });
  }
});

module.exports = router; 