import app from './app';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

console.log(`[${new Date().toISOString()}] Starting server...`);

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Server is running on port ${PORT}`);
  console.log(`[${new Date().toISOString()}] Environment: ${process.env.NODE_ENV}`);
}); 