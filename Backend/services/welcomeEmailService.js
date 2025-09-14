const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // Force to false as we're using port 587 with STARTTLS
  requireTLS: true, // Force using STARTTLS
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false
  },
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  debug: true // Show debug output
});

const sendWelcomeEmail = async (user, role = 'student') => {
  try {
    const isTeacher = role === 'teacher';
    const userType = isTeacher ? 'Teacher' : 'Student';
    const userCode = isTeacher ? user.teacherCode : user.studentCode;
    const codeLabel = isTeacher ? 'Teacher Code' : 'Student Code';
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Welcome to ScholarSync - Your ${userType} Account Details`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Welcome to ScholarSync</h2>
          <p>Dear ${user.name},</p>
          
          ${isTeacher 
            ? `<p>Congratulations! Your teacher account has been successfully created in our ScholarSync Attendance System.`
            : `<p>Congratulations! Your student account has been successfully created in our ScholarSync Attendance System.`
          }
          
          <p>Here are your account details:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>${codeLabel}:</strong> ${userCode}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Mobile No:</strong> ${user.phone}</p>
          </div>

          <h3 style="color: #2c3e50; margin-top: 25px;">Getting Started</h3>
          <p>${isTeacher 
            ? 'As a teacher, you can now create your own slots for your class/course. Also, you can add new students and view statistics regarding attendance.'
            : 'As a student, you can now start marking your attendance and tracking your attendance history. Also, you can apply leave directly from our portal.'
          }</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href=${isTeacher ? "https://scholarsync.online/documentation/teachers" : "https://scholarsync.online/documentation/students"} style="display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              ${isTeacher ? "View Teacher Instructions" : "View Student Instructions"}
            </a>
          </div>
          
          <h3 style="color: #2c3e50;">Login Credentials</h3>
          <p>You can login with your email and password:</p>
          <div style="background-color: #e9f7ef; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
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
            <a href="scholarsync.online" style="display: inline-block; padding: 12px 30px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">
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
      `
    };

    await transporter.sendMail(mailOptions);
    //console.log(`Welcome email sent to ${user.email} (${role})`);
  } catch (error) {
    console.error(`Error sending welcome email to ${user.email}:`, error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  transporter
};
