const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  customer: {
    type: String,
    required: true,
    trim: true
  },
  items: [{
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
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
    },
    subtotal: {
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
    enum: ['CASH', 'CREDIT', 'CARD', 'UPI', 'INSURANCE'],
    required: true,
    default: 'CASH'
  },
  paymentStatus: {
    type: String,
    enum: ['PAID', 'PARTIAL', 'DUE'],
    required: true,
    default: 'PAID'
  },
  paidAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  dueAmount: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  prescriptionImagePath: {
    type: String
  },
  prescriptionOriginalFilename: {
    type: String
  }
}, {
  timestamps: true
});

// Pre-save hook to calculate dueAmount
saleSchema.pre('save', function(next) {
  if (this.paymentType === 'CREDIT') {
    this.dueAmount = this.finalAmount - this.paidAmount;
    if (this.paidAmount === 0) {
      this.paymentStatus = 'DUE';
    } else if (this.paidAmount < this.finalAmount) {
      this.paymentStatus = 'PARTIAL';
    } else {
      this.paymentStatus = 'PAID';
    }
  } else {
    this.paidAmount = this.finalAmount;
    this.dueAmount = 0;
    this.paymentStatus = 'PAID';
  }
  next();
});

module.exports = mongoose.model('Sale', saleSchema); 