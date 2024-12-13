import { getAssetUrl } from '@helpers/fetch.helpers.js';
import mongoose, { Schema, Types } from 'mongoose';

function getProfileImgUrl(imagePathname: string) {
  if (!imagePathname) {
    return '';
  }

  return getAssetUrl(imagePathname);
}

export interface IRefreshTokenObject {
  token: string;
  deviceId: string;
  expDate: Date;
}

export interface IUser {
  email: string;
  password: string;
  username: string;
  profileImg: string;
  serversIn: Types.ObjectId[];
  chatsIn: { userId: Types.ObjectId; chatId: Types.ObjectId }[];
  friends: Types.ObjectId[];
  refreshTokens: IRefreshTokenObject[];
}

const UserSchema = new mongoose.Schema<IUser>({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  username: {
    type: String,
  },
  // stores pathname to the file
  profileImg: {
    type: String,
    _id: false,
    get: getProfileImgUrl,
  },
  serversIn: [{ type: Schema.Types.ObjectId, ref: 'Server', default: [] }],
  chatsIn: {
    type: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        chatId: { type: Schema.Types.ObjectId, ref: 'Chat' },
      },
    ],
    default: [],
  },
  friends: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
  refreshTokens: {
    type: [{ token: String, deviceId: String, expDate: Date }],
    default: [],
  },
});

export default mongoose.models.User ||
  mongoose.model<IUser>('User', UserSchema);
