const mongoose = require('mongoose');

const vendorTransactionSchema = new mongoose.Schema({
  vendor: {
    type: String,
    required: true,
    trim: true
  },
  medicine: {
    type: String,
    required: true,
    trim: true
  },
  transactionType: {
    type: String,
    enum: ['PURCHASE', 'PAYMENT'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
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
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calculate due amount before saving
vendorTransactionSchema.pre('save', function(next) {
  if (this.paymentStatus === 'PAID') {
    this.paidAmount = this.amount;
    this.dueAmount = 0;
  } else if (this.paymentStatus === 'DUE') {
    this.paidAmount = 0;
    this.dueAmount = this.amount;
  } else if (this.paymentStatus === 'PARTIAL') {
    this.dueAmount = this.amount - this.paidAmount;
  }
  next();
});

module.exports = mongoose.model('VendorTransaction', vendorTransactionSchema); 