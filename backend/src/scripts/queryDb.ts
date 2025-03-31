import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

// Import all models
import User from '../models/User';
import Medicine from '../models/Medicine';
import Sale from '../models/Sale';
import PurchaseOrder from '../models/PurchaseOrder';
import Vendor from '../models/Vendor';

async function queryDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://rgnitw:rohyt5740@salesapp.nslxbyu.mongodb.net/?retryWrites=true&w=majority&appName=SalesApp');
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