import mongoose, { Schema, Types } from 'mongoose';

export interface IRefreshTokenObject {
  token: string;
  expDate: Date;
}
  email: string;
  password: string;
  username: string;
  profileImg: string;
  serversMember: Types.ObjectId[];
  chatsMember: { userId: Types.ObjectId; chatId: Types.ObjectId }[];
  friends: Types.ObjectId[];
  refreshTokens: IRefreshTokenObject[];
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
