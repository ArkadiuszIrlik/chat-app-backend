import User, { IUser } from '@models/User.js';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';

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

export { getUser, addServerAsMember, checkIfIsInServer };
