import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import medicineRoutes from './routes/medicines';
import salesRoutes from './routes/sales';
import purchaseOrderRoutes from './routes/purchaseOrders';
import vendorRoutes from './routes/vendors';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();

// Log all requests
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/health', (_req, res) => {
  console.log(`[${new Date().toISOString()}] Basic health check hit`);
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api', healthRoutes);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB
console.log(`[${new Date().toISOString()}] Attempting to connect to MongoDB...`);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app')
  .then(() => {
    console.log(`[${new Date().toISOString()}] Successfully connected to MongoDB`);
  })
  .catch((error) => {
    console.error(`[${new Date().toISOString()}] MongoDB connection error:`, error);
  });

// Log environment variables (excluding sensitive data)
console.log(`[${new Date().toISOString()}] Environment:`, {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI ? '***' : undefined
});

export default app; 