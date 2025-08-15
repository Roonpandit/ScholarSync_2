const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userRoutes = require('./routes/studentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const cron = require('./config/cron');
const attendanceReminder = require('./config/attendanceReminderCron');

// Load env vars
dotenv.config();

// Connect to database
connectDB().then(() => {
  console.log('MongoDB Connected');
  
  // Initialize cron jobs
  cron.updateSlotStatuses();
  attendanceReminder.scheduleAttendanceReminder();
  
  // Initialize app
  const app = express();
  const PORT = process.env.PORT;
  
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
  
  // Keep-alive endpoint
  app.get('/keep-alive', (req, res) => {
    console.log(`Keep-alive ping received at ${new Date().toISOString()}`);
    res.status(200).json({ 
      status: 'alive', 
      timestamp: new Date().toISOString(),
      message: 'Server is awake and running'
    });
  });

  // Mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/teacher', teacherRoutes);
  app.use('/api/students', userRoutes);
  app.use('/api/reviews', reviewRoutes);

  // Error handling middleware (should be after all other middleware and routes)
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: 'Something went wrong!',
      error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
  });

  // Handle 404 - Keep this as the last route
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found'
    });
  });

  // Basic route for testing
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'ScholarSync Attendance API is running'
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
  
  // Start server
  const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
  });
});
