import mongoose from 'mongoose';

const prescriptionSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: true
  },
  patientPhone: String,
  prescriptionDate: {
    type: Date,
    default: Date.now
  },
  medicines: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    dosage: String,
    duration: String,
    instructions: String
  }],
  status: {
    type: String,
    enum: ['pending', 'filled', 'cancelled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notes: String,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Prescription', prescriptionSchema); 