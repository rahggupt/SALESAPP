import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import medicineRoutes from './routes/medicines';
import salesRoutes from './routes/sales';
import purchaseOrderRoutes from './routes/purchaseOrders';
import vendorRoutes from './routes/vendors';
import healthRoutes from './routes/health';
import prescriptionRoutes from './routes/prescriptions';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'development' ? '.env.development' : '.env';
dotenv.config({ path: path.resolve(__dirname, '..', envFile) });

const app = express();

// Debug log for application startup
console.debug(`[${new Date().toISOString()}] Application starting...`);
console.debug(`[${new Date().toISOString()}] Environment: ${process.env.NODE_ENV}`);
console.debug(`[${new Date().toISOString()}] Port: ${process.env.PORT}`);
console.debug(`[${new Date().toISOString()}] MongoDB URI: ${process.env.MONGODB_URI ? '***' : 'not set'}`);

// Log all requests with more details
app.use((req, _res, next) => {
  console.debug(`[${new Date().toISOString()}] Request: ${req.method} ${req.url}`);
  console.debug(`[${new Date().toISOString()}] Headers:`, JSON.stringify(req.headers, null, 2));
  console.debug(`[${new Date().toISOString()}] Body:`, JSON.stringify(req.body, null, 2));
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route with debug logs
app.get('/health', (_req, res) => {
  console.debug(`[${new Date().toISOString()}] Health check hit`);
  console.debug(`[${new Date().toISOString()}] MongoDB connection state: ${mongoose.connection.readyState}`);
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState,
    env: process.env.NODE_ENV,
    port: process.env.PORT
  });
});

// Routes with debug logs
console.debug(`[${new Date().toISOString()}] Registering routes...`);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
console.debug(`[${new Date().toISOString()}] Routes registered successfully`);

// Error handling middleware with debug logs
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.debug(`[${new Date().toISOString()}] Error occurred:`, err);
  console.debug(`[${new Date().toISOString()}] Error stack:`, err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to MongoDB with debug logs
console.debug(`[${new Date().toISOString()}] Attempting to connect to MongoDB...`);
console.debug(`[${new Date().toISOString()}] MongoDB URI: ${process.env.MONGODB_URI ? process.env.MONGODB_URI : 'not set'}`);
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sales-app')
  .then(() => {
    console.debug(`[${new Date().toISOString()}] Successfully connected to MongoDB`);
    console.debug(`[${new Date().toISOString()}] MongoDB connection state: ${mongoose.connection.readyState}`);
  })
  .catch((error) => {
    console.debug(`[${new Date().toISOString()}] MongoDB connection error:`, error);
    console.debug(`[${new Date().toISOString()}] MongoDB connection state: ${mongoose.connection.readyState}`);
  });

// Log environment variables (excluding sensitive data)
console.debug(`[${new Date().toISOString()}] Environment variables:`, {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  MONGODB_URI: process.env.MONGODB_URI ? process.env.MONGODB_URI : undefined
});

export default app; 