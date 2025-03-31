import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  items: [{
    medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, required: true },
  customerName: String,
  customerPhone: String,
  paymentMethod: String,
  isPaid: { type: Boolean, default: true },
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Sale', saleSchema); 