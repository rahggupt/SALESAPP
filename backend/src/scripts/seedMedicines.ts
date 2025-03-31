import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Medicine from '../models/Medicine';
import Vendor from '../models/Vendor';

// Load environment variables
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

const categories = [
  'Antibiotics',
  'Pain Relief',
  'Fever',
  'Cold & Cough',
  'Vitamins',
  'Antacids',
  'Antihistamines',
  'Antifungals',
  'Antivirals',
  'Antidepressants'
];

const manufacturers = [
  'Sun Pharma',
  'Cipla',
  'Dr. Reddy\'s',
  'Lupin',
  'Glenmark',
  'Torrent Pharma',
  'Cadila Healthcare',
  'Aurobindo Pharma',
  'Divis Laboratories',
  'Biocon'
];

const compositions = [
  ['Paracetamol'],
  ['Ibuprofen'],
  ['Amoxicillin'],
  ['Azithromycin'],
  ['Cetirizine'],
  ['Omeprazole'],
  ['Vitamin C'],
  ['Vitamin D'],
  ['Vitamin B12'],
  ['Folic Acid']
];

async function seedMedicines() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app');
    console.log('Connected to MongoDB successfully');

    // First, create a sample vendor if none exists
    let vendor = await Vendor.findOne();
    if (!vendor) {
      vendor = await Vendor.create({
        name: 'Sample Vendor',
        contactPerson: 'John Doe',
        phone: '+1234567890',
        email: 'vendor@example.com',
        address: '123 Vendor Street',
        isActive: true
      });
    }

    // Clear existing medicines
    await Medicine.deleteMany({});
    console.log('Cleared existing medicines');

    // Generate and insert sample medicines
    const medicines = [];
    for (let i = 0; i < 50; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
      const composition = compositions[Math.floor(Math.random() * compositions.length)];
      const price = Math.floor(Math.random() * 1000) + 100;
      const stock = Math.floor(Math.random() * 100) + 10;
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      medicines.push({
        name: `${manufacturer} ${category} ${i + 1}`,
        composition,
        description: `Sample medicine ${i + 1} for ${category}`,
        category,
        price,
        stock,
        expiryDate,
        manufacturer,
        batchNumber: `${manufacturer.substring(0, 2)}${String(i + 1).padStart(4, '0')}`,
        requiresPrescription: Math.random() > 0.5,
        storage: ['cold', 'extreme_cold', 'hot', 'extreme_hot'][Math.floor(Math.random() * 4)],
        vendor: vendor._id,
        purchasePrice: price * 0.7,
        paymentStatus: ['PAID', 'PARTIAL', 'DUE'][Math.floor(Math.random() * 3)],
        paidAmount: Math.floor(Math.random() * price * 0.7),
        dueAmount: Math.floor(Math.random() * price * 0.7),
        isActive: true
      });
    }

    await Medicine.insertMany(medicines);
    console.log(`Successfully seeded ${medicines.length} medicines`);

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
seedMedicines(); 