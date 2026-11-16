const mongoose = require('mongoose');

const dbState = {
  connected: false,
  isMock: false,
  message: 'Initializing...',
  uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auth_db'
};

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/auth_db';
  const allowFallback = process.env.USE_MOCK_FALLBACK !== 'false';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000
    });

    dbState.connected = true;
    dbState.isMock = false;
    dbState.message = `Connected to MongoDB (${conn.connection.host}/${conn.connection.name})`;
    console.log(`[DB] Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    if (allowFallback) {
      dbState.connected = true;
      dbState.isMock = true;
      dbState.message = 'In-Memory Fallback Active (MongoDB service offline)';
      console.log('[DB] MongoDB offline. Using In-Memory Storage Fallback.');
    } else {
      dbState.connected = false;
      dbState.isMock = false;
      dbState.message = `Connection failed: ${error.message}`;
      console.error(`[DB] MongoDB Connection Error: ${error.message}`);
    }
  }
};

module.exports = { connectDB, dbState };
