const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medicine-shop', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB for seeding'))
.catch(err => console.error('MongoDB connection error:', err));

const seedUsers = async () => {
    try {
        // Clear existing users
        await User.deleteMany({});
        console.log('Cleared existing users');

        // Create admin user with directly hashed password
        const adminPassword = await bcrypt.hash('admin123', 10);
        await User.collection.insertOne({
            username: 'admin',
            password: adminPassword,
            role: 'admin',
            createdAt: new Date()
        });
        console.log('Admin user created: admin');

        // Create viewer user with directly hashed password
        const viewerPassword = await bcrypt.hash('viewer123', 10);
        await User.collection.insertOne({
            username: 'viewer',
            password: viewerPassword,
            role: 'viewer',
            createdAt: new Date()
        });
        console.log('Viewer user created: viewer');

        // Create regular user with directly hashed password
        const userPassword = await bcrypt.hash('user123', 10);
        await User.collection.insertOne({
            username: 'user',
            password: userPassword,
            role: 'user',
            createdAt: new Date()
        });
        console.log('Regular user created: user');

        console.log('Database seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedUsers(); 