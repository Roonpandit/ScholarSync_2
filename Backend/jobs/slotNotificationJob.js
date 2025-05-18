const cron = require('node-cron');
const notificationService = require('../services/notificationService');
const Slot = require('../models/AttendanceSlot');
const User = require('../models/User');

// Helper to convert a date to IST
const toIST = (date) => {
  const d = new Date(date);
  return isNaN(d) ? null : new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
};

// Schedule to run every minute in IST timezone
const startSlotNotifications = () => {
  try {
    // Schedule the job using UTC time
    cron.schedule('* * * * *', async () => {
      try {
        const nowUTC = new Date();
        const nowIST = toIST(nowUTC);

        const upcomingSlots = await Slot.find({
          notified: false,
          startTime: {
            $gte: nowIST,
            $lte: new Date(nowIST.getTime() + 10 * 60 * 1000)
          }
        });

        for (const slot of upcomingSlots) {
          // Validate required fields
          if (!slot.date || !slot.startTime || isNaN(new Date(slot.date)) || isNaN(new Date(slot.startTime))) {
            console.error(`Invalid slot date/startTime for slot ID: ${slot._id}`);
            continue;
          }

          const dateIST = toIST(slot.date);
          const startTimeIST = toIST(slot.startTime);

          const message = `⏰ Reminder: Your attendance slot starts in 10 minutes!\n` +
                          `Date: ${dateIST.toLocaleDateString('en-IN')}\n` +
                          `Time: ${startTimeIST.toLocaleTimeString('en-IN')}\n` +
                          `Shift: ${slot.shift ? slot.shift.charAt(0).toUpperCase() + slot.shift.slice(1) : 'N/A'}\n` +
                          `Please mark your attendance on time.`;

          const students = await User.find();

          for (const student of students) {
            if (student.phone) {
              try {
                await notificationService.sendSMS(student.phone, message);
              } catch (error) {
                console.error(`Error sending notification to ${student.phone}:`, error);
              }
            }
          }

          await Slot.findByIdAndUpdate(slot._id, { notified: true });
        }
      } catch (error) {
        console.error('Error in slot notification job:', error);
      }
    });
  } catch (error) {
    console.error('Error initializing cron job:', error);
  }
};

module.exports = {
  startSlotNotifications
};
