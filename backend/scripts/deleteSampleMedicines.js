const mongoose = require('mongoose');
const Medicine = require('../models/Medicine');
require('dotenv').config();

const deleteSampleMedicines = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete all medicines
    const result = await Medicine.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} medicines`);

    console.log('Deletion completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error deleting medicines:', error);
    process.exit(1);
  }
};

deleteSampleMedicines(); 