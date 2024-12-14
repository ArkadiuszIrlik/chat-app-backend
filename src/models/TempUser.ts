import { TEMP_USER_MAX_AGE } from '@config/auth.config.js';
import {
  EmailVerificationSchema,
  IEmailVerification,
} from '@models/EmailVerificationToken.js';
import mongoose from 'mongoose';

export interface ITempUser {
  email: string;
  password: string;
  expDate: Date;
  emailVerificationTokens: IEmailVerification[];
}

const TempUserSchema = new mongoose.Schema<ITempUser>({
  email: { type: String, required: true },
  password: { type: String, required: true },
  expDate: {
    type: Date,
    required: true,
    default: () => Date.now() + TEMP_USER_MAX_AGE,
  },
  emailVerificationTokens: {
    type: [EmailVerificationSchema],
    required: true,
    default: () => [],
  },
});

export default mongoose.model<ITempUser>('TempUser', TempUserSchema);
