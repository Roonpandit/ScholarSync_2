const dotenv = require('dotenv');

// Load env vars
dotenv.config();

const connectDB = require('./config/db');
const cron = require('./config/cron');
const attendanceReminder = require('./config/attendanceReminderCron');
const markAbsentCron = require('./config/markAbsentCron');

// Connect to database
connectDB().then(() => {
  console.log('MongoDB Connected');

  // Initialize cron jobs
  cron.updateSlotStatuses();
  attendanceReminder.scheduleAttendanceReminder();
  markAbsentCron.scheduleMarkAbsent();

  // Import app after env is loaded
  const app = require('./index');
  const PORT = process.env.PORT;

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
