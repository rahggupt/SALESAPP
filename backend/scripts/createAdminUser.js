require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createAdminUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Check if admin user already exists
        const existingAdmin = await User.findOne({ username: 'admin' });
        if (existingAdmin) {
            console.log('Admin user already exists');
            await mongoose.disconnect();
            return;
        }

        // Create admin user
        const adminUser = new User({
            username: 'admin',
            password: 'admin123',
            role: 'ADMIN',
            email: 'admin@example.com',
            fullName: 'System Administrator',
            isActive: true
        });

        await adminUser.save();
        console.log('Admin user created successfully');
    } catch (error) {
        console.error('Error creating admin user:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createAdminUser(); 