import { VERIFICATION_MAIL_EXP_TIME } from '@config/mail.config.js';
import mongoose, { Schema, Types } from 'mongoose';

interface IEmailVerification {
  token: string;
  userId: Types.ObjectId;
  email: string;
  expDate: Date;
}

const EmailVerificationSchema = new mongoose.Schema<IEmailVerification>({
  token: {
    type: String,
    index: { unique: true },
    required: true,
  },
  userId: Schema.Types.ObjectId,
  email: { type: String, required: true },
  expDate: {
    type: Date,
    required: true,
    default: () => Date.now() + VERIFICATION_MAIL_EXP_TIME,
  },
});

export default mongoose.model<IEmailVerification>(
  'EmailVerification',
  EmailVerificationSchema,
);
