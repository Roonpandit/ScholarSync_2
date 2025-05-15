const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const AttendanceSlot = require('./models/AttendanceSlot'); // import model

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Route imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS with specific origin and credentials
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS.split(","), // Your frontend URL
  credentials: true, // Allow credentials (cookies, authorization headers)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', userRoutes);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Masai Elevate Attendance API is running'
  });
});

// Error handler middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || 'Server Error'
  });
});

const PORT = process.env.PORT;

// Function to fetch active slots
const fetchActiveSlots = async () => {
  try {
    const today = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const now = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });

    const activeSlots = await AttendanceSlot.find({
      date: today,
      isActive: true,
      startTime: { $lte: now },
      endTime: { $gte: now }
    }).populate('class', '_id name');

    console.log('Active slots:', activeSlots);
  } catch (error) {
    console.error('Error fetching active slots:', error.message);
  }
};

// Start server and run fetch function
const server = app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  await fetchActiveSlots();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});
