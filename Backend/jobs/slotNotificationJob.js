const cron = require("node-cron");
const notificationService = require("../services/notificationService");
const Slot = require("../models/AttendanceSlot");
const User = require("../models/User");

// Helper to add minutes to a date
const addMinutes = (date, minutes) => {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
};

// Schedule to run every minute using UTC time
const startSlotNotifications = () => {
  try {
    // Schedule the job using UTC time (every minute)
    cron.schedule("* * * * *", async () => {
      try {
        const now = new Date();
        const tenMinutesLater = addMinutes(now, 10);

        console.log(`Checking for slots between ${now.toISOString()} and ${tenMinutesLater.toISOString()}`);

        const upcomingSlots = await Slot.find({
          notified: false,
          startTime: {
            $gte: now,
            $lte: tenMinutesLater,
          },
        });

        for (const slot of upcomingSlots) {
          // Validate required fields
          if (
            !slot.date ||
            !slot.startTime ||
            isNaN(new Date(slot.date)) ||
            isNaN(new Date(slot.startTime))
          ) {
            console.error(
              `Invalid slot date/startTime for slot ID: ${slot._id}`
            );
            continue;
          }

          const message =
            `⏰ Reminder: Your attendance slot starts in 10 minutes!\n` +
            `Date: ${slot.date}\n` +
            `Time: ${slot.startTime}\n` +
            `Shift: ${
              slot.shift
                ? slot.shift.charAt(0).toUpperCase() + slot.shift.slice(1)
                : "N/A"
            }\n` +
            `Please mark your attendance on time.`;

          const students = await User.find();

          for (const student of students) {
            if (student.phone) {
              try {
                await notificationService.sendSMS(student.phone, message);
              } catch (error) {
                console.error(
                  `Error sending notification to ${student.phone}:`,
                  error
                );
              }
            }
          }

          await Slot.findByIdAndUpdate(slot._id, { notified: true });
        }
      } catch (error) {
        console.error("Error in slot notification job:", error);
      }
    });
  } catch (error) {
    console.error("Error initializing cron job:", error);
  }
};

module.exports = {
  startSlotNotifications,
};