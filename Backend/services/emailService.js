const nodemailer = require('nodemailer');
const User = require('../models/User');
const AttendanceSlot = require('../models/AttendanceSlot');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

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

1. Attendance selfies must be taken only in Masai office.
2. Attendance submitted from outside of Masai office will not be considered.
   *(Exception: Night shift for girls only. Only they are allowed to give attendance from pg)*
3. Use the leave option if you're taking a day off. If you're absent without applying for leave for more than 2 days, you may be subject to Code of Conduct actions.
4. Do not submit attendance on behalf of others. This is considered a breach of discipline, and strict action will be taken if found involved in such activity.

Best regards,
Abhishesh
Masai Elevate Program`
    };

    await transporter.sendMail(mailOptions);
    //console.log(`Email sent successfully to ${students.length} students for slot ${slot._id}`);
    return true;
  } catch (error) {
    console.error(`Error sending email:`, error);
    return false;
  }
};

module.exports = {
  sendAttendanceReminder
};
