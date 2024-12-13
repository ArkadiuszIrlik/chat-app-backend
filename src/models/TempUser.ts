import { VERIFICATION_MAIL_EXP_TIME } from '@config/mail.config.js';
import mongoose from 'mongoose';

export interface ITempUser {
  email: string;
  password: string;
  expDate: Date;
}

const TempUserSchema = new mongoose.Schema<ITempUser>({
  email: { type: String, required: true },
  password: { type: String, required: true },
  expDate: {
    type: Date,
    required: true,
    default: () => Date.now() + VERIFICATION_MAIL_EXP_TIME,
  },
});

export default mongoose.model<ITempUser>('TempUser', TempUserSchema);
