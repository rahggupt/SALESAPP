const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  customer: {
    type: String,
    required: true,
    trim: true
  },
  medicines: [{
    medicine: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  finalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentType: {
    type: String,
    enum: ['CASH', 'CREDIT'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['PAID', 'PARTIAL', 'DUE'],
    required: true
  },
  paidAmount: {
    type: Number,
    required: true,
    min: 0
  },
  dueAmount: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Sale', saleSchema); 