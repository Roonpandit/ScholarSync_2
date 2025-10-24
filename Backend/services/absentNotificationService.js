const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Send absent notification email to student
const sendAbsentNotificationEmail = async (emailData) => {
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
    const transporter = createTransporter();

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
    const subject = `⚠️ Attendance Marked as Absent - ${lectureName} - ${formattedDate} - ${capitalizedShift} Shift`;

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
          <h2>⚠️ Attendance Status Update</h2>
        </div>

        <div class="content">
          <p>Dear <strong>${studentName}</strong>,</p>

          <p>Your attendance for <strong>${lectureName}</strong> has been <strong style="color: #dc3545;">MARKED AS ABSENT</strong> by ${updatedByName} (${updatedByRole}).</p>

          <div class="detail-row">
            <div class="detail-label">📅 Date:</div>
            <div class="detail-value">${formattedDate}</div>
          </div>

          <div class="detail-row">
            <div class="detail-label">🕐 Shift:</div>
            <div class="detail-value">${capitalizedShift} (${slotTime})</div>
          </div>

          <div class="detail-row">
            <div class="detail-label">📚 Lecture:</div>
            <div class="detail-value">${lectureName}</div>
          </div>

          <div class="remark-box">
            <div class="detail-label">📝 Reason for Marking Absent:</div>
            <div class="detail-value" style="margin-top: 10px; font-style: italic;">
              "${remark}"
            </div>
          </div>

          <h3 style="color: #555; margin-top: 20px;">Original Attendance Details:</h3>

          <div class="detail-row">
            <div class="detail-label">✅ Initially Marked At:</div>
            <div class="detail-value">${formattedMarkedAt}</div>
          </div>

          <div class="detail-row">
            <div class="detail-label">📍 Location:</div>
            <div class="detail-value">${location}</div>
          </div>

          ${photoUrl ? `
            <div class="photo-section">
              <div class="detail-label" style="margin-bottom: 10px;">📸 Submitted Attendance Photo:</div>
              <img src="${photoUrl}" alt="Attendance Photo" />
            </div>
          ` : ''}

          <div class="warning-box">
            <strong>⚠️ Important:</strong><br>
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

⚠️ IMPORTANT:
Please ensure you follow proper attendance protocols in the future. Repeated violations may result in disciplinary action.

If you believe this is an error, please contact your ${updatedByRole === 'admin' ? 'administrator' : 'teacher'} immediately.

---
ScholarSync Attendance System
This is an automated email. Please do not reply to this message.
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"ScholarSync Attendance" <${process.env.SMTP_FROM_EMAIL}>`,
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

module.exports = {
  sendAbsentNotificationEmail,
};
