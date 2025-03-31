import express from 'express';
import Prescription from '../models/Prescription';

const router = express.Router();

// Get all prescriptions
router.get('/', async (_req, res) => {
  try {
    const prescriptions = await Prescription.find({})
      .populate('medicines.medicine', 'name price')
      .populate('createdBy', 'name email');
    res.json(prescriptions);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get prescription statistics
router.get('/stats/count', async (_req, res) => {
  try {
    const [
      totalPrescriptions,
      pendingPrescriptions,
      filledPrescriptions,
      cancelledPrescriptions
    ] = await Promise.all([
      Prescription.countDocuments(),
      Prescription.countDocuments({ status: 'pending' }),
      Prescription.countDocuments({ status: 'filled' }),
      Prescription.countDocuments({ status: 'cancelled' })
    ]);

    res.json({
      total: totalPrescriptions,
      pending: pendingPrescriptions,
      filled: filledPrescriptions,
      cancelled: cancelledPrescriptions
    });
  } catch (error) {
    console.error('Error fetching prescription stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router; 