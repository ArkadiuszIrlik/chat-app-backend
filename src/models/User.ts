import mongoose, { Schema } from 'mongoose';

export interface IUser extends mongoose.Document {
  email: string;
  password: string;
  username: string;
  profileImg: string;
  serversMember: string[];
  chatsMember: { userId: string; chatId: string }[];
  friends: string[];
  refreshTokens: { token: string; expDate: Date }[];
}

const UserSchema = new mongoose.Schema<IUser>({
  email: String,
  password: String,
  username: String,
  profileImg: String,
  serversMember: [{ type: Schema.Types.ObjectId, ref: 'Server' }],
  chatsMember: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User' },
      chatId: { type: Schema.Types.ObjectId, ref: 'Chat' },
    },
  ],
  friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  refreshTokens: [{ token: String, expDate: Date }],
});

export default mongoose.models.User ||
  mongoose.model<IUser>('User', UserSchema);
