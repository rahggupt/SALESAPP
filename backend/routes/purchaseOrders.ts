import express from 'express';
import PurchaseOrder from '../models/PurchaseOrder';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all purchase orders
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find({ createdBy: req.user.id })
      .populate('vendorId', 'name')
      .populate('items.medicineId', 'name unit')
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
    const { vendorId, items } = req.body;

    // Validate required fields
    if (!vendorId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Vendor and at least one item are required' });
    }

    // Create new purchase order
    const purchaseOrder = new PurchaseOrder({
      vendorId,
      items,
      createdBy: req.user.id,
      status: 'pending'
    });

    await purchaseOrder.save();

    // Populate the response with vendor and medicine details
    const populatedOrder = await PurchaseOrder.findById(purchaseOrder._id)
      .populate('vendorId', 'name')
      .populate('items.medicineId', 'name unit');

    res.status(201).json(populatedOrder);
  } catch (error) {
    console.error('Error creating purchase order:', error);
    res.status(500).json({ message: 'Error creating purchase order' });
  }
});

// Update purchase order status
router.patch('/:id/status', authenticateToken, async (req: any, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['pending', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const purchaseOrder = await PurchaseOrder.findOneAndUpdate(
      { _id: id, createdBy: req.user.id },
      { status },
      { new: true }
    ).populate('vendorId', 'name')
     .populate('items.medicineId', 'name unit');

    if (!purchaseOrder) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    res.json(purchaseOrder);
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    res.status(500).json({ message: 'Error updating purchase order status' });
  }
});

// Delete a purchase order
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;

    const purchaseOrder = await PurchaseOrder.findOneAndDelete({
      _id: id,
      createdBy: req.user.id,
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