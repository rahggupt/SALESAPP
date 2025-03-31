import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  composition: [{ type: String, required: true }],
  description: String,
  category: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'NPR' },
  priceUnit: { type: String, default: 'piece' },
  stock: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  manufacturer: { type: String, required: true },
  batchNumber: { type: String, required: true },
  requiresPrescription: { type: Boolean, default: false },
  storage: { type: String, required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  purchasePrice: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['PAID', 'PARTIAL', 'DUE'], default: 'DUE' },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Medicine', medicineSchema); 