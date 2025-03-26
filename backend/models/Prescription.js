const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
    patientName: {
        type: String,
        required: true,
        trim: true
    },
    doctorName: {
        type: String,
        required: true,
        trim: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    medicines: [{
        medicineId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Medicine',
            required: true
        },
        dosage: {
            type: String,
            required: true
        },
        duration: {
            type: String,
            required: true
        }
    }],
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true
    },
    imagePath: {
        type: String,
        required: true
    },
    originalFilename: {
        type: String,
        required: true
    },
    s3Key: {
        type: String,
        required: false
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reviewedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', PrescriptionSchema); 