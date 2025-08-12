const nodemailer = require('nodemailer');
require('dotenv').config();

// Reuse the transporter from welcome email service
const { transporter } = require('./welcomeEmailService');

const sendPasswordResetEmail = async (email, name, resetToken) => {
  // Get the second origin from ALLOWED_ORIGINS (production URL)
  const productionUrl = process.env.ALLOWED_ORIGINS.split(',')[1];
  const resetUrl = `${productionUrl}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request - Attendance Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your password for the Attendance Tracker account.</p>
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
          <p>© ${new Date().getFullYear()} Attendance Tracker. All rights reserved.</p>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return { success: false, error: error.message };
  }
};

const sendPasswordResetConfirmation = async (email, name) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Successful - Attendance Tracker',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2>Password Reset Successful</h2>
        <p>Hello ${name},</p>
        <p>Your password has been successfully reset for your Attendance Tracker account.</p>
        <p>If you did not make this change, please contact support immediately by replying to this email.</p>
        
        <div style="margin: 25px 0; padding: 15px; background-color: #f0fdf4; border-left: 4px solid #10b981;">
          <p style="margin: 0; color: #065f46;">
            <strong>Security Tip:</strong> For your security, never share your password with anyone.
          </p>
        </div>
        
        <p>If you have any questions or need further assistance, please don't hesitate to contact our support team.</p>
        
        <p>Best regards,<br>The Attendance Tracker Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset confirmation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { 
  sendPasswordResetEmail,
  sendPasswordResetConfirmation 
  
};
