import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Vendor from '../src/models/Vendor';

// Load environment variables
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

const sampleVendors = [
  {
    name: 'PharmaCare Ltd',
    contactPerson: 'John Doe',
    phone: '+977-1-4444444',
    email: 'john@pharmacare.com',
    address: 'Kathmandu, Nepal',
    gstNumber: 'GST123456',
    isActive: true
  },
  {
    name: 'MediSupply Co',
    contactPerson: 'Jane Smith',
    phone: '+977-1-5555555',
    email: 'jane@medisupply.com',
    address: 'Lalitpur, Nepal',
    gstNumber: 'GST789012',
    isActive: true
  },
  {
    name: 'HealthCare Solutions',
    contactPerson: 'Mike Johnson',
    phone: '+977-1-6666666',
    email: 'mike@healthcare.com',
    address: 'Bhaktapur, Nepal',
    gstNumber: 'GST345678',
    isActive: true
  }
];

async function seedVendors() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app');
    console.log('Connected to MongoDB successfully');

    // Clear existing vendors
    await Vendor.deleteMany({});
    console.log('Cleared existing vendors');

    // Insert sample vendors
    const vendors = await Vendor.insertMany(sampleVendors);
    console.log(`Seeded ${vendors.length} vendors`);

    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
seedVendors(); 