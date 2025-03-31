const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    composition: [{
        type: String,
        required: true,
        trim: true
    }],
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'NPR',
        enum: ['NPR', 'INR']
    },
    priceUnit: {
        type: String,
        required: true,
        trim: true,
        enum: ['piece', 'box', 'strip', 'bottle', 'pack']
    },
    unitsPerPackage: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    stock: {
        type: Number,
        required: true,
        min: 0
    },
    expiryDate: {
        type: Date,
        required: true,
        get: function(date) {
            if (!date) return '';
            return date.toISOString().slice(0, 7); // Return YYYY-MM format
        },
        set: function(date) {
            if (!date) return null;
            // If date is already in YYYY-MM format, append -01 for the day
            if (date.match(/^\d{4}-\d{2}$/)) {
                return new Date(date + '-01');
            }
            return new Date(date);
        }
    },
    manufacturer: {
        type: String,
        required: true,
        trim: true
    },
    batchNumber: {
        type: String,
        required: true,
        trim: true
    },
    requiresPrescription: {
        type: Boolean,
        default: false
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    storage: {
        type: String,
        required: true,
        enum: ['cold', 'extreme_cold', 'hot', 'extreme_hot']
    },
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vendor',
        required: true
    },
    purchasePrice: {
        type: Number,
        required: true,
        min: 0
    },
    purchaseCurrency: {
        type: String,
        required: true,
        default: 'NPR',
        enum: ['NPR', 'INR']
    },
    paymentStatus: {
        type: String,
        enum: ['PAID', 'PARTIAL', 'DUE'],
        required: true,
        default: 'DUE'
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
    lastPaymentDate: {
        type: Date
    },
    paymentHistory: [{
        amount: {
            type: Number,
            required: true
        },
        date: {
            type: Date,
            required: true,
            default: Date.now
        },
        status: {
            type: String,
            required: true,
            enum: ['PAID', 'PARTIAL']
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
});

// Remove the unique index on composition array
// medicineSchema.index({ composition: 1 }, { unique: true });

// Calculate due amount before saving
medicineSchema.pre('save', function(next) {
    if (this.paymentStatus === 'PAID') {
        this.paidAmount = this.purchasePrice;
        this.dueAmount = 0;
        this.lastPaymentDate = new Date();
    } else if (this.paymentStatus === 'DUE') {
        this.paidAmount = 0;
        this.dueAmount = this.purchasePrice;
    } else if (this.paymentStatus === 'PARTIAL') {
        this.dueAmount = this.purchasePrice - this.paidAmount;
        if (this.paidAmount > 0) {
            this.lastPaymentDate = new Date();
        }
    }
    next();
});

// Add method to update payment
medicineSchema.methods.updatePayment = async function(amount, status) {
    this.paidAmount = amount;
    this.paymentStatus = status;
    this.dueAmount = this.purchasePrice - amount;
    
    if (amount > 0) {
        this.lastPaymentDate = new Date();
        this.paymentHistory.push({
            amount,
            status,
            date: new Date()
        });
    }
    
    return this.save();
};

// Add method to calculate profit margin
medicineSchema.methods.calculateProfitMargin = function() {
    const sellingPrice = this.price;
    const purchasePrice = this.purchasePrice;
    return ((sellingPrice - purchasePrice) / purchasePrice) * 100;
};

module.exports = mongoose.model('Medicine', medicineSchema); 