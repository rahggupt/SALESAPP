import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

router.get('/health', (req, res) => {
  console.log(`[${new Date().toISOString()}] Health check endpoint hit`);
  
  try {
    const dbState = mongoose.connection.readyState;
    console.log(`[${new Date().toISOString()}] Database state: ${dbState}`);
    
    const response = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbState === 1 ? 'connected' : 'disconnected',
      environment: process.env.NODE_ENV,
      port: process.env.PORT
    };
    
    console.log(`[${new Date().toISOString()}] Health check response:`, response);
    res.json(response);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Health check error:`, error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 