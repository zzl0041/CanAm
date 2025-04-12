import mongoose from 'mongoose';

if (!process.env.MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  try {
    if (cached.conn) {
      console.log('Using cached database connection');
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
      };

      console.log('Connecting to MongoDB...');
      cached.promise = mongoose.connect(MONGODB_URI, opts);
    }

    cached.conn = await cached.promise;
    console.log('Successfully connected to MongoDB');
    return cached.conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    cached.promise = null;
    throw error;
  }
}

export default dbConnect; 