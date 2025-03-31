const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin user exists
        const adminUser = await User.findOne({ email: 'admin@example.com' });
        
        if (adminUser) {
            console.log('Admin user already exists');
            await mongoose.connection.close();
            return;
        }

        // Create admin user
        const newAdmin = new User({
            name: 'Admin User',
            email: 'admin@example.com',
            password: 'admin123',
            role: 'ADMIN',
            phone: '1234567890',
            address: 'Admin Address',
            isActive: true
        });

        await newAdmin.save();
        console.log('Admin user created successfully');
        
        await mongoose.connection.close();
    } catch (error) {
        console.error('Error creating admin user:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

createAdminUser(); 