import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Medicine from '../models/Medicine';

// Load environment variables
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', '..', envFile) });

async function checkDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? '***' : 'not set');
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app');
    console.log('Connected to MongoDB successfully');

    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\nCollections found:', collections.map(c => c.name));

    // Check medicines
    const medicineCount = await Medicine.countDocuments();
    console.log('\nTotal medicines in database:', medicineCount);

    if (medicineCount > 0) {
      console.log('\nSample medicine:');
      const sampleMedicine = await Medicine.findOne();
      console.log(JSON.stringify(sampleMedicine, null, 2));
    }

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
checkDatabase(); 