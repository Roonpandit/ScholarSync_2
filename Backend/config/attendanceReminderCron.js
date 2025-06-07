const cron = require('node-cron');
const AttendanceSlot = require('../models/AttendanceSlot');
const Student = require('../models/User');
const { sendAttendanceReminder } = require('../services/emailService');

// Function to check and send reminders for upcoming slots
const sendAttendanceReminders = async () => {
  try {
    // Get current time in IST
    const now = new Date();
    //console.log('Checking attendance slots at:', now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

    // Find all upcoming slots that haven't been notified and are within 15 minutes
    const slots = await AttendanceSlot.find({
      status: 'upcoming',
      notified: false,
      startTime: { $gt: now, $lt: new Date(now.getTime() + 15 * 60000) }
    });

    //console.log('Found upcoming slots:', slots.length);
    
    if (slots.length === 0) return;

    // Process each slot
    for (const slot of slots) {
      //console.log('Processing slot:', slot._id, 'at', slot.startTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
      
      // Send reminder email to all students
      const success = await sendAttendanceReminder(slot._id);
      if (!success) {
        console.error('Failed to send reminder for slot:', slot._id);
      } else {
        // Update slot status
        await AttendanceSlot.findByIdAndUpdate(slot._id, {
          notified: true,
          emailSent: true,
          notificationSentAt: new Date()
        });
        //console.log('Successfully sent reminder to all students for slot:', slot._id);
      }
    }
  } catch (error) {
    console.error('Error in attendance reminder cron job:', error);
  }
};

// Schedule the job to run every minute
const scheduleAttendanceReminder = () => {
  cron.schedule('*/1 * * * *', sendAttendanceReminders);
  //console.log('Attendance reminder cron job initialized');
};

module.exports = {
  scheduleAttendanceReminder,
  sendAttendanceReminders // Export for testing
};
