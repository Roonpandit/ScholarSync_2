import { Student, AttendanceSlot } from 'scholarsync-backend-common';
import { createTransporter, sendEmail } from '../../helper/email-transport.js';
import dotenv from 'dotenv';
dotenv.config();

// ========================
// WELCOME EMAIL
// ========================
const sendWelcomeEmail = async (data) => {
  try {
    const { name, email, role = 'student', studentCode, teacherCode, phone } = data;
    const isTeacher = role === 'teacher';
    const userType = isTeacher ? 'Teacher' : 'Student';
    const userCode = isTeacher ? teacherCode : studentCode;
    const codeLabel = isTeacher ? 'Teacher Code' : 'Student Code';

    const subject = `Welcome to ScholarSync - Your ${userType} Account Details`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to ScholarSync</h2>
        <p>Dear ${name},</p>

        ${isTeacher
          ? `<p>Congratulations! Your teacher account has been successfully created in our ScholarSync Attendance System.</p>`
          : `<p>Congratulations! Your student account has been successfully created in our ScholarSync Attendance System.</p>`
        }

        <p>Here are your account details:</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>${codeLabel}:</strong> ${userCode}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Mobile No:</strong> ${phone}</p>
        </div>

        <h3 style="color: #2c3e50; margin-top: 25px;">Getting Started</h3>
        <p>${isTeacher
          ? 'As a teacher, you can now create your own slots for your class/course. Also, you can add new students and view statistics regarding attendance.'
          : 'As a student, you can now start marking your attendance and tracking your attendance history. Also, you can apply leave directly from our portal.'
        }</p>

        <div style="text-align: center; margin: 25px 0;">
          <a href="${isTeacher ? 'https://scholarsync.online/documentation/teachers' : 'https://scholarsync.online/documentation/students'}" style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
            ${isTeacher ? 'View Teacher Instructions' : 'View Student Instructions'}
          </a>
        </div>

        <h3 style="color: #2c3e50;">Login Credentials</h3>
        <p>You can login with your email and password:</p>
        <div style="background-color: #e9f7ef; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0;">
          <p><strong>Email:</strong> ${email}</p>
        </div>

        <p>Your temporary password follows this format: <strong>Firstname@123</strong></p>
        <p>For example, if your name is Tarun Vashisth, your temporary password will be: <strong>Tarun@123</strong></p>

        <div style="background-color: #e3f2fd; border-left: 4px solid #2196F3; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <h4 style="color: #0d47a1; margin-top: 0;">Important: Update Your Password</h4>
          <p style="margin-bottom: 0;">
            This is your temporary password. <strong>You must update your password immediately after your first login</strong>
            for security reasons. You can change your password in your account profile after logging in.
          </p>
        </div>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">Important Security Notice</h4>
          <p style="margin-bottom: 0;">
            Please keep your login credentials confidential. Sharing your password is strictly prohibited and may result in disciplinary action.
            ${isTeacher ? 'As a teacher, you have access to sensitive student data and must maintain the highest level of security.' : ''}
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://scholarsync.online" style="display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
            Login to ScholarSync
          </a>
        </div>

        <p>If you have any questions or need assistance, please contact our support team.</p>

        <p>Best regards,<br>
        <strong>The ScholarSync Team</strong></p>

        <p style="font-size: 12px; color: #6c757d; margin-top: 30px; border-top: 1px solid #e9ecef; padding-top: 15px;">
          This is an automated message. Please do not reply to this email.
        </p>
      </div>
    `;

    await sendEmail(email, subject, htmlBody);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ========================
// PASSWORD RESET EMAIL
// ========================
const sendPasswordResetEmail = async (email, name, resetToken) => {
  // Get the second origin from ALLOWED_ORIGINS (production URL)
  const productionUrl = process.env.ALLOWED_ORIGINS.split(',')[1];
  const resetUrl = `${productionUrl}/reset-password/${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request - ScholarSync',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password for the ScholarSync account.</p>
        <p>Please use the link below to set a new password:</p>

        <div style="margin: 25px 0; text-align: center;">
          <a href="${resetUrl}"
             style="display: inline-block; padding: 12px 24px;
                    background-color: #4f46e5;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    font-weight: bold;">
            Reset Password
          </a>
        </div>

        <p>If you didn't request this, please ignore this email. The password reset link will expire in 10 minutes.</p>
        <p>For security reasons, do not share this email with anyone.</p>

        <div style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          <p>This email was sent to ${email}</p>
          <p>&copy; ${new Date().getFullYear()} ScholarSync. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return { success: false, error: error.message };
  }
};

// ========================
// PASSWORD RESET CONFIRMATION
// ========================
const sendPasswordResetConfirmation = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Successful - ScholarSync',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset Successful</h2>
        <p>Hello ${name},</p>
        <p>Your password has been successfully reset for your ScholarSync account.</p>
        <p>If you did not make this change, please contact support immediately by replying to this email.</p>

        <div style="margin: 25px 0; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981;">
          <p style="margin: 0; color: #065f46;">
            <strong>Security Tip:</strong> For your security, never share your password with anyone.
          </p>
        </div>

        <p>If you have any questions or need further assistance, please don't hesitate to contact our support team.</p>

        <p>Best regards,<br>The ScholarSync Team</p>
      </div>
    `
  };

  try {
    const transporter = await createTransporter();
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset confirmation email:', error);
    return { success: false, error: error.message };
  }
};

// ========================
// ATTENDANCE REMINDER
// ========================
const sendAttendanceReminder = async (slotId) => {
  try {
    // Get all students
    const students = await Student.findAll({
      where: { role: 'student' },
      attributes: ['email']
    });
    const slot = await AttendanceSlot.findByPk(slotId);

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
    console.log(`Email sent successfully to ${students.length} students for slot ${slot.id}`);
    return true;
  } catch (error) {
    console.error(`Error sending email:`, error);
    return false;
  }
};

// ========================
// ABSENT NOTIFICATION
// ========================
const sendAbsentNotification = async (emailData) => {
  const {
    studentName,
    studentEmail,
    lectureName,
    date,
    shift,
    slotTime,
    markedAt,
    location,
    photoUrl,
    remark,
    updatedByName,
    updatedByRole
  } = emailData;

  try {
    // Format date
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Format marked at time
    const formattedMarkedAt = new Date(markedAt).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    // Capitalize shift
    const capitalizedShift = shift.charAt(0).toUpperCase() + shift.slice(1);

    // Email subject
    const subject = `\u26A0\uFE0F Attendance Marked as Absent - ${lectureName} - ${formattedDate} - ${capitalizedShift} Shift`;

    // Email HTML body
    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #dc3545;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
          }
          .content {
            background-color: #f9f9f9;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 0 0 5px 5px;
          }
          .detail-row {
            margin: 10px 0;
            padding: 10px;
            background-color: white;
            border-left: 3px solid #dc3545;
          }
          .detail-label {
            font-weight: bold;
            color: #555;
          }
          .detail-value {
            color: #333;
            margin-top: 5px;
          }
          .remark-box {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
          }
          .warning-box {
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            color: #721c24;
          }
          .photo-section {
            margin: 15px 0;
            text-align: center;
          }
          .photo-section img {
            max-width: 100%;
            height: auto;
            border: 2px solid #ddd;
            border-radius: 5px;
          }
          .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>\u26A0\uFE0F Attendance Status Update</h2>
        </div>

        <div class="content">
          <p>Dear <strong>${studentName}</strong>,</p>

          <p>Your attendance for <strong>${lectureName}</strong> has been <strong style="color: #dc3545;">MARKED AS ABSENT</strong> by ${updatedByName} (${updatedByRole}).</p>

          <div class="detail-row">
            <div class="detail-label">\uD83D\uDCC5 Date:</div>
            <div class="detail-value">${formattedDate}</div>
          </div>

          <div class="detail-row">
            <div class="detail-label">\uD83D\uDD50 Shift:</div>
            <div class="detail-value">${capitalizedShift} (${slotTime})</div>
          </div>

          <div class="detail-row">
            <div class="detail-label">\uD83D\uDCDA Lecture:</div>
            <div class="detail-value">${lectureName}</div>
          </div>

          <div class="remark-box">
            <div class="detail-label">\uD83D\uDCDD Reason for Marking Absent:</div>
            <div class="detail-value" style="margin-top: 10px; font-style: italic;">
              "${remark}"
            </div>
          </div>

          <h3 style="color: #555; margin-top: 20px;">Original Attendance Details:</h3>

          <div class="detail-row">
            <div class="detail-label">\u2705 Initially Marked At:</div>
            <div class="detail-value">${formattedMarkedAt}</div>
          </div>

          <div class="detail-row">
            <div class="detail-label">\uD83D\uDCCD Location:</div>
            <div class="detail-value">${location}</div>
          </div>

          ${photoUrl ? `
            <div class="photo-section">
              <div class="detail-label" style="margin-bottom: 10px;">\uD83D\uDCF8 Submitted Attendance Photo:</div>
              <img src="${photoUrl}" alt="Attendance Photo" />
            </div>
          ` : ''}

          <div class="warning-box">
            <strong>\u26A0\uFE0F Important:</strong><br>
            Please ensure you follow proper attendance protocols in the future. Repeated violations may result in disciplinary action.
            <br><br>
            If you believe this is an error, please contact your ${updatedByRole === 'admin' ? 'administrator' : 'teacher'} immediately.
          </div>

          <p style="margin-top: 20px;">
            This is an automated notification. Please do not mark attendance through fraudulent means or any suspicious activity.
          </p>
        </div>

        <div class="footer">
          <p>
            <strong>ScholarSync Attendance System</strong><br>
            This is an automated email. Please do not reply to this message.
          </p>
        </div>
      </body>
      </html>
    `;

    // Plain text version
    const textBody = `
Dear ${studentName},

Your attendance for ${lectureName} has been MARKED AS ABSENT by ${updatedByName} (${updatedByRole}).

Attendance Details:
- Date: ${formattedDate}
- Shift: ${capitalizedShift} (${slotTime})
- Lecture: ${lectureName}

Reason for Marking Absent:
"${remark}"

Original Attendance Details:
- Initially Marked At: ${formattedMarkedAt}
- Location: ${location}
${photoUrl ? `- Photo: ${photoUrl}` : ''}

\u26A0\uFE0F IMPORTANT:
Please ensure you follow proper attendance protocols in the future. Repeated violations may result in disciplinary action.

If you believe this is an error, please contact your ${updatedByRole === 'admin' ? 'administrator' : 'teacher'} immediately.

---
ScholarSync Attendance System
This is an automated email. Please do not reply to this message.
    `;

    // Send email
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: subject,
      text: textBody,
      html: htmlBody,
    });

    console.log('Absent notification email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending absent notification email:', error);
    throw error;
  }
};

// ========================
// FEEDBACK EMAILS
// ========================

// Professional email template
const feedbackEmailTemplate = (studentName, feedbackLink) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.8;
            background-color: #f5f5f5;
            color: #333;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 3px solid #0056b3;
        }
        .header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .content {
            padding: 30px 20px;
            color: #444;
        }
        .content p {
            margin: 15px 0;
            font-size: 15px;
        }
        .button {
            display: inline-block;
            padding: 12px 24px;
            background: linear-gradient(135deg, #007bff, #0056b3);
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: all 0.3s ease;
            margin: 20px 0;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        .button:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
        .signature {
            margin-top: 30px;
            border-top: 1px solid #eee;
            padding-top: 20px;
            text-align: center;
        }
        .signature p {
            color: #666;
            font-size: 14px;
        }
        @media (max-width: 600px) {
            .container {
                margin: 0 10px;
            }
            .header {
                padding: 20px;
            }
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Feedback Request</h2>
        </div>
        <div class="content">
            <p>Dear ${studentName},</p>
            <p>We hope this email finds you well. As part of our continuous improvement process, we would like to gather your valuable feedback about your experience with our ScholarSync portal.</p>
            <p>We value your thoughts and would love to hear about your experience. Your feedback will help us enhance our portal and make it even better for future students.</p>
            <p><a href="${feedbackLink}" class="button">Provide Feedback</a></p>
            <p>Your input is highly valuable to us. It will help us:</p>
            <ul style="margin: 15px 0; padding-left: 20px;">
                <li>Improve our features</li>
                <li>Enhance user experience</li>
                <li>Address any issues you may have encountered</li>
            </ul>
            <p>Thank you for taking the time to share your thoughts. Your feedback is greatly appreciated!</p>
            <div class="signature">
                <p>Best regards,<br>The ScholarSync Team</p>
                <p style="font-size: 13px; color: #888;">ScholarSync</p>
            </div>
        </div>
    </div>
</body>
</html>
`;

const sendFeedbackEmails = async (feedbackLink, studentIds) => {
  // Get students
  const students = await Student.findAll({ where: { id: studentIds } });

  // Create transporter using OAuth2
  const transporter = await createTransporter();

  // Send emails
  const promises = students.map(async (student) => {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: 'Feedback Request - ScholarSync',
      html: feedbackEmailTemplate(student.name, feedbackLink)
    };

    return transporter.sendMail(mailOptions);
  });

  await Promise.all(promises);

  return { success: true, count: students.length };
};

export default {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendAttendanceReminder,
  sendAbsentNotification,
  sendFeedbackEmails
};
