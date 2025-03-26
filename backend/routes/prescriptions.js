const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const auth = require('../middleware/auth');
const Prescription = require('../models/Prescription');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Set up multer storage for memory storage (not saving to disk)
const storage = multer.memoryStorage();

// File filter to only allow image uploads
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

// @route   POST api/prescriptions/upload
// @desc    Upload a prescription image to S3
// @access  Private
router.post('/upload', auth, upload.single('prescriptionImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'Please upload a prescription image' });
    }

    const { patientName, doctorName, notes } = req.body;

    if (!patientName || !doctorName) {
      return res.status(400).json({ msg: 'Patient name and doctor name are required' });
    }

    // Generate a unique filename for S3
    const fileKey = `prescriptions/${uuidv4()}-${req.file.originalname.replace(/\s+/g, '-')}`;

    // Set up S3 upload parameters
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: fileKey,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read' // Make the file publicly accessible
    };

    // Upload file to S3
    const s3UploadResult = await s3.upload(params).promise();
    
    // Create new prescription record with S3 URL
    const newPrescription = new Prescription({
      patientName,
      doctorName,
      notes: notes || '',
      imagePath: s3UploadResult.Location, // Use the S3 URL
      originalFilename: req.file.originalname,
      s3Key: fileKey, // Store S3 key for future reference (deletion, etc.)
      uploadedBy: req.user.id,
      status: 'pending' // Default status is pending review
    });

    const prescription = await newPrescription.save();
    res.json(prescription);
  } catch (err) {
    console.error('Error uploading prescription:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/prescriptions
// @desc    Get all prescriptions
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only show prescriptions uploaded by the user
    if (req.user.role !== 'admin') {
      query.uploadedBy = req.user.id;
    }
    
    const prescriptions = await Prescription.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .populate('uploadedBy', 'username role');
      
    res.json(prescriptions);
  } catch (err) {
    console.error('Error fetching prescriptions:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/prescriptions/stats/count
// @desc    Get total count of prescriptions
// @access  Private
router.get('/stats/count', auth, async (req, res) => {
  try {
    let query = {};
    
    // If not admin, only count prescriptions uploaded by the user
    if (req.user.role !== 'admin') {
      query.uploadedBy = req.user.id;
    }
    
    const count = await Prescription.countDocuments(query);
    res.json({ count });
  } catch (err) {
    console.error('Error getting prescription count:', err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/prescriptions/:id
// @desc    Get prescription by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('uploadedBy', 'username role');
    
    if (!prescription) {
      return res.status(404).json({ msg: 'Prescription not found' });
    }
    
    // If not admin and not uploader, deny access
    if (req.user.role !== 'admin' && prescription.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    res.json(prescription);
  } catch (err) {
    console.error('Error fetching prescription:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Prescription not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/prescriptions/:id/status
// @desc    Update prescription status (admin only)
// @access  Private/Admin
router.put('/:id/status', auth, async (req, res) => {
  try {
    // Only admin can update status
    if (req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied. Admin only.' });
    }
    
    const { status } = req.body;
    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ msg: 'Invalid status value' });
    }
    
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ msg: 'Prescription not found' });
    }
    
    prescription.status = status;
    prescription.reviewedAt = Date.now();
    prescription.reviewedBy = req.user.id;
    
    await prescription.save();
    res.json(prescription);
  } catch (err) {
    console.error('Error updating prescription status:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Prescription not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/prescriptions/:id
// @desc    Delete a prescription
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    
    if (!prescription) {
      return res.status(404).json({ msg: 'Prescription not found' });
    }
    
    // Check if user is admin or the uploader
    if (req.user.role !== 'admin' && prescription.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied' });
    }
    
    // Delete the file from S3 if it has an S3 key
    if (prescription.s3Key) {
      const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: prescription.s3Key
      };
      
      await s3.deleteObject(deleteParams).promise();
    }
    
    await prescription.remove();
    res.json({ msg: 'Prescription removed' });
  } catch (err) {
    console.error('Error deleting prescription:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Prescription not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router; 