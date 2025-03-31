import mongoose from 'mongoose';

const purchaseOrderSchema = new mongoose.Schema({
  items: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  status: { type: String, enum: ['pending', 'received', 'cancelled'], default: 'pending' },
  orderedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('PurchaseOrder', purchaseOrderSchema); 