'use strict';

const mongoose = require('mongoose');
const env = require('./env');

/**
 * Connects to MongoDB. Rejects on failure so the caller can decide what to do
 * (the server exits; tests surface the error).
 */
const connectDb = async (uri = env.MONGO_URL) => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  return mongoose.connection;
};

const disconnectDb = () => mongoose.disconnect();

module.exports = { connectDb, disconnectDb };
