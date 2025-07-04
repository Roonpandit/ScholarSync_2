const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

const generatePassword = (name) => {
  // Generate password as Firstname@123
  return name.split(' ')[0].charAt(0).toUpperCase() + name.split(' ')[0].slice(1).toLowerCase() + '@123';
};

const sendWelcomeEmail = async (student) => {
  try {
    const password = generatePassword(student.name);
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: 'Welcome to Attendance Tracker - Your Account Details',
      html: `
        <h2>Welcome to Attendance Tracker</h2>
        <p>Dear ${student.name},</p>
        <p>Thank you for joining our Attendance Tracker system. Here are your account details:</p>
        <ul>
          <li><strong>Name:</strong> ${student.name}</li>
          <li><strong>Student Code:</strong> ${student.studentCode}</li>
          <li><strong>Email:</strong> ${student.email}</li>
        </ul>

        <h3>Getting Started</h3>
        <p>Click the button below to read full instructions:</p>
        <a href="https://docs.example.com/attendance-tracker" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">
          View Instructions
        </a>
        
        <h3>Login Credentials</h3>
        <p> You can login with your email and password</p>
        <p>Your login password is a combination of Your firstname (First letter capital) + @ + 123</p>
        <p>For example, if your name is Tarun Vashisth, your password will be Tarun@123</p>
        
        <div style="color: red;">
          <strong>Important Notice:</strong>
          <p>Please keep your password confidential. Sharing your password with other students is strictly prohibited and may result in disciplinary action.</p>
        </div>

        <p>You can login to your account using the following link:</p>
        <a href="https://attendence-murex.vercel.app/" style="display: inline-block; padding: 10px 20px; background-color: #2196F3; color: white; text-decoration: none; border-radius: 5px;">
          Login to Attendance Tracker
        </a>

        <p>Thank you and have a great day!</p>
        <p>The Attendance Tracker Team</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${student.email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  transporter
};
