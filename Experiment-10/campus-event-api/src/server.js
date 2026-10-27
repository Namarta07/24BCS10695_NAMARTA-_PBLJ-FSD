require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');
const Registration = require('./models/Registration');

const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_events';

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB connected');

    await Registration.init();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

start();
