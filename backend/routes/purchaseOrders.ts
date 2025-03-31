import express from 'express';
import PurchaseOrder from '../models/PurchaseOrder';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all purchase orders
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .populate('vendorId', 'name')
      .populate('assignee', 'username')
      .sort({ createdAt: -1 });
    res.json(purchaseOrders);
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    res.status(500).json({ message: 'Error fetching purchase orders' });
  }
});

// Create a new purchase order
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { vendorId, items, assigneeId, paymentStatus, paidAmount } = req.body;

    // Validate required fields
    if (!vendorId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Vendor and at least one item are required' });
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
      status: 'pending',
      paymentStatus: paymentStatus || 'DUE',
      paidAmount: paidAmount || 0
    });

    await purchaseOrder.save();

    // Populate the response with vendor and assignee details
    const populatedOrder = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('vendorId', 'name')
      .populate('assignee', 'username');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ message: error.message || 'Error creating purchase order' });
  }
});

// Update purchase order status
router.patch('/:id/status', authenticateToken, async (req: any, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['pending', 'completed', 'cancelled', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const purchaseOrder = await PurchaseOrder.findOneAndUpdate(
      { _id: id },
      { status },
      { new: true }
    ).populate('vendorId', 'name')
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

// Update purchase order payment status
router.patch('/:id/payment', authenticateToken, async (req: any, res) => {
  try {
    const { paymentStatus, paidAmount } = req.body;
    const { id } = req.params;

    if (!['PAID', 'PARTIAL', 'DUE'].includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status' });
    }

    const purchaseOrder = await PurchaseOrder.findOneAndUpdate(
      { _id: id },
      { paymentStatus, paidAmount },
      { new: true }
    ).populate('vendorId', 'name')
     .populate('assignee', 'username');

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error updating purchase order payment:', error);
    res.status(500).json({ message: 'Error updating purchase order payment' });
  }
});

// Delete a purchase order
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
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

export default router; 