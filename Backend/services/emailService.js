const User = require('../models/Student');
const AttendanceSlot = require('../models/AttendanceSlot');
require('dotenv').config();

// Import the createTransporter function from welcomeEmailService
const { createTransporter } = require('./welcomeEmailService');

const sendAttendanceReminder = async (slotId) => {
  try {
    // Get all students
    const students = await User.find({ role: 'student' }).select('email');
    const slot = await AttendanceSlot.findById(slotId);

    // Convert UTC timestamps to IST
    const startTimeIST = new Date(slot.startTime).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const endTimeIST = new Date(slot.endTime).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const startTimeWithOffset = new Date(new Date(slot.startTime).getTime() + 5.5 * 60 * 60 * 1000);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: students.map(student => student.email).join(','),
      subject: 'Reminder for Upcoming Attendance Slot',
      text: `Dear Students,

This is a reminder for the upcoming attendance slot:

Time: ${startTimeIST} - ${endTimeIST}
Shift: ${slot.shift.charAt(0).toUpperCase() + slot.shift.slice(1)}
Date: ${startTimeWithOffset.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}

Instructions:

1. Attendance selfies must be taken in proper lighting.
2. Attendance submitted without proper face will not be considered.
3. Use the leave option if you're taking a day off. If you're absent without applying for leave for more than 2 days, you may be subject to Code of Conduct actions.
4. Do not submit attendance on behalf of others. This is considered a breach of discipline, and strict action will be taken if found involved in such activity.

Best regards,
ScholarSync`
    };

    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${students.length} students for slot ${slot._id}`);
    return true;
  } catch (error) {
    console.error(`Error sending email:`, error);
    return false;
  }
};

module.exports = {
  sendAttendanceReminder
};