import mongoose from 'mongoose';

export interface ITempUser {
  email: string;
  password: string;
  expDate: Date;
  verificationToken: string;
}

const TempUserSchema = new mongoose.Schema<ITempUser>({
  email: { type: String, required: true },
  password: { type: String, required: true },
  expDate: { type: Date, required: true },
  verificationToken: { type: String, required: true, unique: true },
});

export default mongoose.model<ITempUser>('TempUser', TempUserSchema);
