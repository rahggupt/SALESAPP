require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        const users = await User.find({});
        console.log('Users in database:', users);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkUsers(); 