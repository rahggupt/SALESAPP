const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function checkUser(email, password) {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app');
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email });
        console.log('User found:', user ? 'Yes' : 'No');
        
        if (user) {
            console.log('User details:', {
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            });
            
            const isMatch = await user.comparePassword(password);
            console.log('Password match:', isMatch ? 'Yes' : 'No');
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
    }
}

// Check the specific user
checkUser('rahul@shyama.com', '1Zxcvbnm2?'); 