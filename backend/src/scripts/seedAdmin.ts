import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

// Load environment variables
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', '..', envFile) });

async function seedAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app');
    console.log('Connected to MongoDB successfully');

    // Check if admin user exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists. Updating password...');
      existingAdmin.password = 'admin123'; // This will be hashed by the pre-save hook
      await existingAdmin.save();
    } else {
      // Create new admin user
      const adminUser = new User({
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'ADMIN',
        isActive: true
      });
      await adminUser.save();
    }

    console.log('Admin user seeded successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
seedAdmin(); 