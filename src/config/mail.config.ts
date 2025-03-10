import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer/index.js';

const SENDER_ADDRESS: Mail.Options['from'] = process.env.MAIL_SENDER_ADDRESS;

const mailTransporter = nodemailer.createTransport({
  port: 587,
  host: 'smtp-relay.brevo.com',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export { mailTransporter, SENDER_ADDRESS };
