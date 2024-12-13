import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer/index.js';

const SENDER_ADDRESS: Mail.Options['from'] = `Beluga <${process.env.SMTP_USER}>`;

const mailTransporter = nodemailer.createTransport({
  port: 587,
  host: 'smtp-mail.outlook.com',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const VERIFICATION_MAIL_EXP_TIME = 24 * 60 * 60 * 1000; //ms

export { mailTransporter, SENDER_ADDRESS, VERIFICATION_MAIL_EXP_TIME };
