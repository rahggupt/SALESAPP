const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect('mongodb+srv://rgnitw:rohyt5740@salesapp.nslxbyu.mongodb.net/?retryWrites=true&w=majority&appName=SalesApp');
        console.log('Connected to MongoDB');

        // Check if admin user exists
        const adminExists = await User.findOne({ role: 'ADMIN' });
        
        if (adminExists) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const adminUser = new User({
            name: "Admin User",
            email: "admin@shyama.com",
            password: "1Zxcvbnm2?", // This will be hashed by the pre-save hook
            role: "ADMIN",
            phone: "+1234567890",
            address: "123 Admin Street",
            isActive: true
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        console.log('Email:', adminUser.email);
        console.log('Password: Admin@123');
        console.log('Please change the password after first login!');

    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

// Run the seed function
seedAdmin(); 