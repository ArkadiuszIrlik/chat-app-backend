import { TEMP_USER_MAX_AGE } from '@config/auth.config.js';
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
    default: () => Date.now() + TEMP_USER_MAX_AGE,
  },
});

export default mongoose.model<ITempUser>('TempUser', TempUserSchema);
