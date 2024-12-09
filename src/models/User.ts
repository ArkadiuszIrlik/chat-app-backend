import { getAssetUrl } from '@helpers/fetch.helpers.js';
import { ImageObject, UserOnlineStatus } from '@src/typesModule.js';
import mongoose, { Model, Schema, Types } from 'mongoose';
import * as imagesService from '@services/images.service.js';

// function getProfileImgUrl(profileImg: ImageObject) {
//   if (!profileImg?.pathname) {
//     return '';
//   }

//   return getAssetUrl(profileImg.pathname);
// }

export enum UserAccountStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
}

// function getProfileImgUrl(profileImg: ProfileImg | undefined) {
//   if (!profileImg) {
//     return '';
//   }

//   let pathname: string | undefined = '';
//   if (profileImg.isPreset) {
//     pathname = imagesService.getPresetUserProfileImgPathname(
//       profileImg.presetImageId,
//     );
//   } else {
//     pathname = profileImg.uploadedImage.pathname;
//   }

//   if (!pathname) {
//     return '';
//   }

//   return getAssetUrl(pathname);
// }

export interface IRefreshTokenObject {
  token: string;
  deviceId: string;
  expDate: Date;
}

export type ProfileImgData =
  | { isPreset: true; presetImageId: string }
  | { isPreset: false; uploadedImage: ImageObject };

// export interface IUser {
//   email: string;
//   password: string;
//   username?: string;
//   profileImg?: ProfileImg;
//   profileImgUrl?: string;
//   // profileImg: ImageObject & { get: () => string };
//   prefersOnlineStatus: UserOnlineStatus;
//   serversIn: Types.ObjectId[];
//   chatsIn: { userId: Types.ObjectId; chatId: Types.ObjectId }[];
//   friends: Types.ObjectId[];
//   refreshTokens: IRefreshTokenObject[];
// }

interface IUserBase {
  email: string;
  password: string;
  prefersOnlineStatus: UserOnlineStatus;
  serversIn: Types.ObjectId[];
  chatsIn: { userId: Types.ObjectId; chatId: Types.ObjectId }[];
  friends: Types.ObjectId[];
  refreshTokens: IRefreshTokenObject[];
}

// interface IUserRequired {
//   email: string;
//   password: string;
//   prefersOnlineStatus: UserOnlineStatus;
//   serversIn: Types.ObjectId[];
//   chatsIn: { userId: Types.ObjectId; chatId: Types.ObjectId }[];
//   friends: Types.ObjectId[];
//   refreshTokens: IRefreshTokenObject[];
//   accountStatus: UserAccountStatus.Approved;
//   username: string;
//   profileImgData: ProfileImgData;
//   profileImg: string;
// }

// interface IUserNotRequired {
//   email: string;
//   password: string;
//   prefersOnlineStatus: UserOnlineStatus;
//   serversIn: Types.ObjectId[];
//   chatsIn: { userId: Types.ObjectId; chatId: Types.ObjectId }[];
//   friends: Types.ObjectId[];
//   refreshTokens: IRefreshTokenObject[];
//   accountStatus: UserAccountStatus.Pending;
//   username?: string;
//   profileImgData?: ProfileImgData;
//   profileImg?: string;
// }

// export type IUser = IUserBase;
export type IUser = IUserBase &
  (
    | {
        accountStatus: UserAccountStatus.Pending;
        username?: string;
        profileImgData?: ProfileImgData;
        profileImg?: string;
      }
    | {
        accountStatus: UserAccountStatus.Approved;
        username: string;
        profileImgData: ProfileImgData;
        profileImg: string;
      }
  );

interface IUserVirtuals {
  profileImg: string;
}

type IUserModel = Model<IUser, {}, IUserVirtuals>;

// type RequiredModel = Model<IUserRequired, {}, IUserVirtuals>;
// type NotRequiredModel = Model<IUserNotRequired, {}, IUserVirtuals>;

const UserSchema = new mongoose.Schema<IUser, IUserModel, IUserVirtuals>(
  {
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    username: {
      type: String,
      required() {
        return this.accountStatus === UserAccountStatus.Approved;
      },
    },
    profileImgData: {
      type: {
        isPreset: { type: Boolean, required: true },
        uploadedImage: {
          type: {
            pathname: { type: String, required: true },
            name: { type: String, required: true },
            ext: { type: String, required: true },
          },
          // set(v) {
          //   console.log('VALUE BELOW NESTED');
          //   console.log(v);
          // },
          _id: false,
          required: [
            function () {
              return this.isPreset === false;
            },
            'uploadedImage is required when isPreset is set to false',
          ],
        },
        presetImageId: {
          type: String,
          required: [
            function () {
              return this.isPreset === true;
            },
            'presetImageId is required when isPreset is set to true',
          ],
        },
      },
      _id: false,
      required() {
        return this.accountStatus === UserAccountStatus.Approved;
      },
      // get: getProfileImgUrl,
      // set(v) {
      //   console.log('VALUE BELOW TOP LEVEL');
      //   console.log(v);
      // },
      // get() {
      //   return 'its a string yepppppppp';
      // },
      // get() {
      //   // console.log('DEEEEZ');
      //   // console.log(this);
      //   // console.log('DOZE');
      //   // return this.toObject({ getters: false }).profileImgData;
      //   return 'some string';
      // },
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
  },
  {
    toJSON: { virtuals: true },
    toObject: {
      virtuals: true,
    },
  },
);

UserSchema.virtual('profileImg').get(function () {
  // const this.toObject({getters: false}).profileImgData,
  // const profileImg = this.get('profileImgData', null, { getters: false });
  const profileImg = this.profileImgData;
  if (!profileImg) {
    return '';
  }

  let pathname: string | undefined = '';
  if (profileImg.isPreset) {
    pathname = imagesService.getPresetUserProfileImgPathname(
      profileImg.presetImageId,
    );
  } else {
    pathname = profileImg.uploadedImage.pathname;
  }

  if (!pathname) {
    return '';
  }

  return getAssetUrl(pathname);
});

export default mongoose.model<IUser>('User', UserSchema);
