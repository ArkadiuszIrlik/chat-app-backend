import { getClientUrl } from '@helpers/fetch.helpers.js';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer/index.js';

const SENDER_ADDRESS: Mail.Options['from'] = `Beluga <${process.env.SMTP_USER}>`;
const CLIENT_EMAIL_VERIFICATION_URL = getClientUrl('/verify-email');

const mailTransporter = nodemailer.createTransport({
  port: 587,
  host: 'smtp-mail.outlook.com',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export { mailTransporter, SENDER_ADDRESS, CLIENT_EMAIL_VERIFICATION_URL };
