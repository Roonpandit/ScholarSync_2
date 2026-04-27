import cron from 'node-cron';
import { Op } from 'sequelize';
import { AttendanceSlot } from 'scholarsync-backend-common';
import emailService from '../api/service/email-service.js';

// Function to check and send reminders for upcoming slots
const sendAttendanceReminders = async () => {
  try {
    // Get current time
    const now = new Date();

    // Find all upcoming slots that haven't been notified and are within 15 minutes
    const slots = await AttendanceSlot.findAll({
      where: {
        status: 'upcoming',
        notified: false,
        startTime: {
          [Op.gt]: now,
          [Op.lt]: new Date(now.getTime() + 15 * 60000)
        }
      }
    });

    if (slots.length === 0) return;

    // Process each slot
    for (const slot of slots) {
      // Send reminder email to all students
      const success = await emailService.sendAttendanceReminder(slot.id);
      if (!success) {
        console.error('Failed to send reminder for slot:', slot.id);
      } else {
        // Update slot status
        await slot.update({
          notified: true,
          emailSent: true,
          notificationSentAt: new Date()
        });
      }
    }
  } catch (error) {
    console.error('Error in attendance reminder cron job:', error);
  }
};

// Schedule the job to run every minute
const scheduleAttendanceReminder = () => {
  cron.schedule('*/1 * * * *', sendAttendanceReminders);
};

export {
  scheduleAttendanceReminder,
  sendAttendanceReminders
};
