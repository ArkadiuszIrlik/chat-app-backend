import mongoose, { Schema, Types } from 'mongoose';

export interface IRefreshTokenObject {
  token: string;
  deviceId: string;
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
  refreshTokens: {
    type: [{ token: String, deviceId: String, expDate: Date }],
    default: [],
  },
});

export default mongoose.models.User ||
  mongoose.model<IUser>('User', UserSchema);
