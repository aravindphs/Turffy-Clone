import mongoose from 'mongoose';
import { env } from './env';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

let retryCount = 0;

const connectDB = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    retryCount = 0;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
      scheduleReconnect();
    });
  } catch (error) {
    console.error(`MongoDB connection failed (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error);

    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB();
    }

    console.error('Max retries reached. Exiting...');
    process.exit(1);
  }
};

const scheduleReconnect = (): void => {
  if (retryCount < MAX_RETRIES) {
    retryCount++;
    setTimeout(() => {
      connectDB();
    }, RETRY_DELAY_MS);
  }
};

export const gracefulShutdown = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed gracefully.');
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
  }
};

export default connectDB;
