require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function createViewerUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        // Check if viewer user already exists
        const existingViewer = await User.findOne({ username: 'viewer' });
        if (existingViewer) {
            console.log('Viewer user already exists');
            await mongoose.disconnect();
            return;
        }

        // Create viewer user
        const viewerUser = new User({
            username: 'viewer',
            password: 'viewer123',
            role: 'VIEWER',
            email: 'viewer@example.com',
            fullName: 'System Viewer',
            isActive: true
        });

        await viewerUser.save();
        console.log('Viewer user created successfully');
    } catch (error) {
        console.error('Error creating viewer user:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createViewerUser(); 