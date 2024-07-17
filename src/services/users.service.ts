import User, { IUser } from '@models/User.js';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';
import * as patchService from '@services/patch.service.js';
import { UserOnlineStatus } from '@src/typesModule.js';

async function _getUserFromParam(userParam: HydratedDocument<IUser> | string) {
  if (typeof userParam === 'string') {
    const user = await User.findById(userParam).exec();
    if (user === null) {
      throw Error('User not found');
    }
    return user;
  } else {
    return userParam;
  }
}

async function getUser(
  userId: string,
  { populateServersIn = false }: { populateServersIn?: boolean } = {},
) {
  const user = await User.findById(userId).exec();
  if (user && populateServersIn) {
    user.populate('serversIn');
  }
  return user;
}

async function addServerAsMember(
  userId: string,
  serverId: mongoose.Types.ObjectId,
): Promise<HydratedDocument<IUser>>;
async function addServerAsMember(
  user: HydratedDocument<IUser>,
  serverId: mongoose.Types.ObjectId,
): Promise<HydratedDocument<IUser>>;
async function addServerAsMember(
  user: string | HydratedDocument<IUser>,
  serverId: mongoose.Types.ObjectId,
) {
  const userToModify = await _getUserFromParam(user);

  userToModify.serversIn.push(serverId);
  await userToModify.save();

  return userToModify;
}

async function checkIfIsInServer(
  user: HydratedDocument<IUser>,
  serverId: string,
): Promise<boolean>;
async function checkIfIsInServer(
  userId: string,
  serverId: string,
): Promise<boolean>;
async function checkIfIsInServer(
  user: HydratedDocument<IUser> | string,
  serverId: string,
) {
  const userToCheck = await _getUserFromParam(user);
  const isMember = !!userToCheck.serversIn.find((id) => id.equals(serverId));

  return isMember;
}

async function patchUser(
  user: HydratedDocument<IUser> | string,
  patch: string | any[],
  { saveDocument = true }: { saveDocument?: boolean } = {},
) {
  const userToPatch = await _getUserFromParam(user);
  const patchableUser = patchService.getPatchableUser(userToPatch);
  const patchedUser = patchService.patchDoc(userToPatch, patchableUser, patch);

  if (saveDocument) {
    await patchedUser.save();
  }

  return patchedUser;
}
enum UserAuthLevel {
  Self = 'SELF',
  OtherUser = 'OTHER_USER',
}

export interface ClientSafeIUser {
  _id: mongoose.Types.ObjectId;
  email?: string;
  username: string;
  profileImg: string;
  prefersOnlineStatus?: UserOnlineStatus;
  serversIn?: mongoose.Types.ObjectId[];
  chatsIn?: {
    userId: mongoose.Types.ObjectId;
    chatId: mongoose.Types.ObjectId;
  }[];
  friends?: mongoose.Types.ObjectId[];
  refreshTokens?: { token: string; expDate: Date }[];
}

/** Returns plain object subset of the provided user document
 * with resolved getters. The subset of properties returned is
 * determined by the provided authLevel.
 *
 * @param user User document to subset
 * @param authLevel authorization level, determines which properties
 * of the User doc are considered safe to return
 * @returns plain object with resolved getters
 */
function getClientSafeSubset(
  user: HydratedDocument<IUser>,
  authLevel: UserAuthLevel,
): ClientSafeIUser {
  let safeProperties: (keyof ClientSafeIUser)[] = [];
  switch (authLevel) {
    case UserAuthLevel.Self:
      {
        safeProperties = [
          '_id',
          'email',
          'username',
          'profileImg',
          'prefersOnlineStatus',
          'serversIn',
          'chatsIn',
          'friends',
        ];
      }
      break;
    case UserAuthLevel.OtherUser:
      {
        safeProperties = ['username', 'profileImg'];
      }
      break;
    default: {
      safeProperties = ['username', 'profileImg'];
    }
  }

  const plainObjectUser = user.toObject({ getters: true });

  // type assertion is necessary since mongoose disregards
  // getter return types
  const clientSubset = Object.fromEntries(
    safeProperties.map((key) => [key, plainObjectUser[key]]),
  ) as unknown as ClientSafeIUser;

  return clientSubset;
}

export {
  getUser,
  addServerAsMember,
  checkIfIsInServer,
  patchUser,
  UserAuthLevel,
  getClientSafeSubset,
};
