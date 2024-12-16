import { getAssetUrl } from '@helpers/fetch.helpers.js';
import {
  EmailVerificationSchema,
  IEmailVerification,
} from '@models/EmailVerificationToken.js';
import { UserOnlineStatus } from '@src/typesModule.js';
import mongoose, { Schema, Types } from 'mongoose';

function getProfileImgUrl(imagePathname: string) {
  if (!imagePathname) {
    return '';
  }

  return getAssetUrl(imagePathname);
}

export enum UserAccountStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
}

export interface IRefreshTokenObject {
  token: string;
  deviceId: string;
  expDate: Date;
}

interface IUserBase {
  email: string;
  password: string;
  prefersOnlineStatus: UserOnlineStatus;
  serversIn: Types.ObjectId[];
  chatsIn: { userId: Types.ObjectId; chatId: Types.ObjectId }[];
  friends: Types.ObjectId[];
  refreshTokens: IRefreshTokenObject[];
  emailVerificationTokens: IEmailVerification[];
}

export type IUser = IUserBase &
  (
    | {
        accountStatus: UserAccountStatus.Pending;
        username?: string;
        profileImg?: string;
      }
    | {
        accountStatus: UserAccountStatus.Approved;
        username: string;
        profileImg: string;
      }
  );

const UserSchema = new mongoose.Schema<IUser>({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  username: {
    type: String,
    required() {
      return this.accountStatus === UserAccountStatus.Approved;
    },
  },
  // stores pathname to the file
  profileImg: {
    type: String,
    _id: false,
    get: getProfileImgUrl,
    required() {
      return this.accountStatus === UserAccountStatus.Approved;
    },
  },
  prefersOnlineStatus: {
    type: String,
    enum: UserOnlineStatus,
    required: true,
    default: UserOnlineStatus.Online,
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
  accountStatus: {
    type: String,
    enum: UserAccountStatus,
    default: UserAccountStatus.Pending,
    required: true,
  },
  emailVerificationTokens: {
    type: [EmailVerificationSchema],
    required: true,
    default: () => [],
  },
});

export default mongoose.model<IUser>('User', UserSchema);
