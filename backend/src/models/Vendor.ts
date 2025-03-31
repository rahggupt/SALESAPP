import mongoose from 'mongoose';

const vendorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: String,
  phone: String,
  email: String,
  address: String,
  gstNumber: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Vendor', vendorSchema); 