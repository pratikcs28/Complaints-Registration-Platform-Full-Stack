import nodemailer from 'nodemailer';
import 'dotenv/config';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export const sendOtpEmail = async (to, name, otp) => {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to,
    subject: 'Your Verification OTP',
    text: `Hello ${name},\n\nYour OTP for registration is: ${otp}\n\nIt will expire in 10 minutes.\n\nThank you!`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent successfully to ${to}`);
  } catch (error) {
    console.error(`Failed to send OTP to ${to}:`, error);
    throw error;
  }
};
