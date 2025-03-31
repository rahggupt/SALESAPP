import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';

// Load environment variables
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', '..', envFile) });

async function updateUserPassword(email: string, newPassword: string) {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app');
    console.log('Connected to MongoDB successfully');

    // Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User with email ${email} not found`);
      return;
    }

    // Update the password
    user.password = newPassword;
    await user.save();

    console.log(`Password updated successfully for user: ${email}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Example usage:
// updateUserPassword('admin@example.com', 'newPassword123');

export default updateUserPassword; 