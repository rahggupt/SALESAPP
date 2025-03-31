const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function resetPassword(email, newPassword) {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app');
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email });
        if (!user) {
            console.log('User not found');
            return;
        }

        // Update the password
        user.password = newPassword;
        await user.save();

        console.log('Password reset successful for user:', email);
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Reset password for the user
resetPassword('rahul@shyama.com', '1Zxcvbnm2?'); 