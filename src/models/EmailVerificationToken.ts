import { VERIFICATION_MAIL_MAX_AGE } from '@config/auth.config.js';
import mongoose from 'mongoose';

interface IEmailVerification {
  token: string;
  email: string;
  expDate: Date;
}

const EmailVerificationSchema = new mongoose.Schema<IEmailVerification>({
  token: {
    type: String,
    index: { unique: true },
    required: true,
  },
  email: { type: String, required: true },
  expDate: {
    type: Date,
    required: true,
    default: () => Date.now() + VERIFICATION_MAIL_MAX_AGE,
  },
});

export { IEmailVerification, EmailVerificationSchema };
