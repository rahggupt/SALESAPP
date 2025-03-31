import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();

// Log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] Basic health check hit`);
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', healthRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  res.status(500).json({ error: 'Internal Server Error' });
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