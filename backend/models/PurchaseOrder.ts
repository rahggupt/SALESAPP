import mongoose from 'mongoose';

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  items: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    manufacturer: {
      type: String,
      required: true,
      trim: true
    },
    batchNumber: {
      type: String,
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
    },
    priceUnit: {
      type: String,
      enum: ['piece', 'box', 'strip', 'bottle', 'pack']
    },
    unitsPerPackage: {
      type: Number,
      min: 1,
      default: 1
    },
    storage: {
      type: String,
      required: true,
      enum: ['cold', 'extreme_cold', 'hot', 'extreme_hot']
    },
    requiresPrescription: {
      type: Boolean,
      default: false
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'archived'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['PAID', 'PARTIAL', 'DUE'],
    default: 'DUE'
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  totalAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add virtual for price per piece
purchaseOrderSchema.virtual('items.pricePerPiece').get(function(this: any) {
  if (!this.price || !this.unitsPerPackage) return 0;
  return this.price / this.unitsPerPackage;
});

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

export default PurchaseOrder; 