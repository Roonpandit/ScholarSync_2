const Teacher = require('../models/Teacher');
const Lecture = require('../models/Lecture');
require('dotenv').config();

// Import the createTransporter function from welcomeEmailService
const { createTransporter } = require('./welcomeEmailService');

/**
 * Send email to teachers when there are pending attendance reviews
 * @param {Object} params - Email parameters
 * @param {String} params.lectureId - Lecture ID
 * @param {String} params.slotId - Slot ID
 * @param {String} params.shift - Shift (morning/evening)
 * @param {Date} params.date - Slot date
 * @param {Number} params.pendingCount - Number of pending reviews
 */
const sendTeacherReviewEmail = async ({ lectureId, slotId, shift, date, pendingCount }) => {
  try {
    // Get lecture details
    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      console.error('Lecture not found for review email');
      return false;
    }

    // Get all teachers assigned to this lecture
    const teachers = await Teacher.find({ lectures: lectureId }).select('name email');

    if (!teachers || teachers.length === 0) {
      console.log(`No teachers assigned to lecture ${lecture.name}, skipping review email`);
      return false;
    }

    // Format date
    const slotDate = new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    });

    const shiftFormatted = shift.charAt(0).toUpperCase() + shift.slice(1);

    // Create email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: teachers.map(t => t.email).join(','),
      subject: `Attendance Review Pending - ${lecture.name} (${shiftFormatted} Shift)`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #1890ff; margin-bottom: 20px;">Attendance Review Required</h2>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              Dear Teachers,
            </p>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              The following attendance slot has been closed and is now ready for your review:
            </p>

            <div style="background-color: #f0f5ff; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Lecture:</td>
                  <td style="padding: 8px 0; color: #333;">${lecture.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Date:</td>
                  <td style="padding: 8px 0; color: #333;">${slotDate}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Shift:</td>
                  <td style="padding: 8px 0; color: #333;">${shiftFormatted}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: bold; color: #555;">Pending Reviews:</td>
                  <td style="padding: 8px 0; color: #ff4d4f; font-weight: bold;">${pendingCount} student(s)</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 16px; color: #333; line-height: 1.6;">
              <strong>Action Required:</strong><br>
              Please log in to the ScholarSync portal to review and approve/reject the pending attendance submissions.
            </p>

            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://scholarsync.online'}/teacher/dashboard"
                 style="display: inline-block; padding: 12px 30px; background-color: #1890ff; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Review Attendance
              </a>
            </div>

            <p style="font-size: 14px; color: #666; line-height: 1.6; margin-top: 30px; border-top: 1px solid #e8e8e8; padding-top: 20px;">
              Best regards,<br>
              <strong>ScholarSync Team</strong>
            </p>
          </div>

          <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      `
    };

    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`Review email sent to ${teachers.length} teacher(s) for lecture ${lecture.name}, slot ${slotId}`);
    return true;
  } catch (error) {
    console.error('Error sending teacher review email:', error);
    return false;
  }
};

module.exports = {
  sendTeacherReviewEmail
};