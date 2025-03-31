const mongoose = require('mongoose');
const PurchaseOrder = require('../models/PurchaseOrder');
require('dotenv').config();

const deletePurchaseOrders = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicine-shop');
    console.log('Connected to MongoDB');

    // Get count of purchase orders before deletion
    const countBefore = await PurchaseOrder.countDocuments();
    console.log(`Found ${countBefore} purchase orders to delete`);

    // Delete all purchase orders
    const result = await PurchaseOrder.deleteMany({});
    
    console.log('\nDeletion completed:');
    console.log(`Total orders deleted: ${result.deletedCount}`);
    console.log(`Success rate: ${(result.deletedCount / countBefore * 100).toFixed(2)}%`);

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error during deletion:', err);
    process.exit(1);
  }
};

// Run the deletion
deletePurchaseOrders(); 