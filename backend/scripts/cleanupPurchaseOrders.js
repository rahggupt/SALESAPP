const mongoose = require('mongoose');
const PurchaseOrder = require('../models/PurchaseOrder');
require('dotenv').config();

const cleanupPurchaseOrders = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicine-shop');
    console.log('Connected to MongoDB');

    // Get all purchase orders
    const orders = await PurchaseOrder.find({});
    console.log(`Found ${orders.length} purchase orders to process`);

    let updatedCount = 0;
    let errorCount = 0;

    // Process each order
    for (const order of orders) {
      try {
        // Calculate total amount from items
        const calculatedTotal = order.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);

        // Update the order
        await PurchaseOrder.updateOne(
          { _id: order._id },
          {
            $set: {
              paymentStatus: order.paymentStatus || 'DUE',
              paidAmount: order.paidAmount || 0
            },
            $unset: {
              totalAmount: 1
            }
          }
        );

        updatedCount++;
        if (updatedCount % 100 === 0) {
          console.log(`Processed ${updatedCount} orders...`);
        }
      } catch (err) {
        console.error(`Error processing order ${order._id}:`, err);
        errorCount++;
      }
    }

    console.log('\nCleanup completed:');
    console.log(`Total orders processed: ${orders.length}`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors encountered: ${errorCount}`);

    // Close MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error during cleanup:', err);
    process.exit(1);
  }
};

// Run the cleanup
cleanupPurchaseOrders(); 