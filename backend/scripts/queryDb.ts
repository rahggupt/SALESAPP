import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Debug log for environment
console.log('Current NODE_ENV:', process.env.NODE_ENV);

// Load environment variables
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
const envPath = path.resolve(__dirname, '..', envFile);
console.log('Loading environment file from:', envPath);

dotenv.config({ path: envPath });

// Debug log for environment variables
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '***' : 'not set');

// Import all models
import User from '../src/models/User';
import Medicine from '../src/models/Medicine';
import Sale from '../src/models/Sale';
import PurchaseOrder from '../src/models/PurchaseOrder';
import Vendor from '../src/models/Vendor';

async function queryDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app');
    console.log('Connected to MongoDB successfully');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections found:', collections.map(c => c.name));

    // Query each collection
    console.log('\n=== Users ===');
    const users = await User.find({}, '-password');
    console.log(`Found ${users.length} users:`, JSON.stringify(users, null, 2));

    console.log('\n=== Medicines ===');
    const medicines = await Medicine.find({});
    console.log(`Found ${medicines.length} medicines:`, JSON.stringify(medicines, null, 2));

    console.log('\n=== Sales ===');
    const sales = await Sale.find({});
    console.log(`Found ${sales.length} sales:`, JSON.stringify(sales, null, 2));

    console.log('\n=== Purchase Orders ===');
    const purchaseOrders = await PurchaseOrder.find({});
    console.log(`Found ${purchaseOrders.length} purchase orders:`, JSON.stringify(purchaseOrders, null, 2));

    console.log('\n=== Vendors ===');
    const vendors = await Vendor.find({});
    console.log(`Found ${vendors.length} vendors:`, JSON.stringify(vendors, null, 2));

    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
queryDatabase(); 