import User, { IUser } from '@models/User.js';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose';
async function getUser(userId: string) {
  const user = await User.findById(userId).exec();

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
  let userToModify: HydratedDocument<IUser>;
  if (typeof user === 'string') {
    const nextUser = await User.findById(user).exec();
    if (nextUser === null) {
      throw Error('User not found');
    }
    userToModify = nextUser;
  } else {
    userToModify = user;
  }

  userToModify.serversIn.push(serverId);
  await userToModify.save();

  return userToModify;
}

export { getUser, addServerAsMember };
