const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const medicineRoutes = require('./routes/medicines');
const prescriptionRoutes = require('./routes/prescriptions');
const salesRoutes = require('./routes/sales');
const vendorsRouter = require('./routes/vendors');
const purchaseOrdersRouter = require('./routes/purchaseOrders');
const userRoutes = require('./routes/users');
const User = require('./models/User');

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://sales-app-frontend.onrender.com',
  'https://sales-app.onrender.com',
  'https://sales-app-backend.onrender.com',
  process.env.FRONTEND_URL // Add this to your environment variables
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/health', require('./routes/health'));
app.use('/api/users', require('./routes/users'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/purchase-orders', require('./routes/purchaseOrders'));
app.use('/api/vendors', require('./routes/vendors'));

// Serve prescription images in production
if (process.env.NODE_ENV === 'production') {
  app.use('/uploads/prescriptions', express.static(path.join(__dirname, 'uploads/prescriptions')));
}

// Connect to MongoDB and seed admin user if needed
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Check if admin user exists
    const adminExists = await User.findOne({ role: 'ADMIN' });
    
    if (!adminExists) {
      console.log('No admin user found. Creating admin user...');
      const adminUser = new User({
        name: "Rohit Gupta",
        email: "rohit@shyama.com",
        password: "admin@123",
        role: "ADMIN",
        phone: "+1234567890",
        address: "123 Admin Street",
        isActive: true
      });

      await adminUser.save();
      console.log('Admin user created successfully');
      console.log('Email: rohit@shyama.com');
      console.log('Password: admin@123');
      console.log('Please change the password after first login!');
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/vendors', vendorsRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/build')));
    
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../frontend/build/index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
}); 