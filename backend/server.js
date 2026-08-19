'use strict';

const app = require('./app');
const env = require('./config/env');
const { connectDb } = require('./config/db');

const start = async () => {
  try {
    await connectDb();
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }

  const server = app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal) => () => {
    console.log(`\n${signal} received, shutting down`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown('SIGINT'));
  process.on('SIGTERM', shutdown('SIGTERM'));
};

start();
