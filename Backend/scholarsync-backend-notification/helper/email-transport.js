import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, htmlBody) => {
  const result = await transporter.sendMail({
    from: `"ScholarSync" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: htmlBody,
  });
  return { success: true, messageId: result.messageId };
};

const createTransporter = async () => {
  return {
    sendMail: async (mailOptions) => {
      const { to, subject, html, text } = mailOptions;
      return sendEmail(to, subject, html || text || '');
    },
  };
};

export { createTransporter, sendEmail };
