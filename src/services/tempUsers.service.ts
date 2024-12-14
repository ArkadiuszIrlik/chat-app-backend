import { TEMP_USER_MAX_AGE } from '@config/auth.config.js';
import TempUser, { ITempUser } from '@models/TempUser.js';
import { HydratedDocument, Types } from 'mongoose';

async function _getTempUserFromParam(
  tempUserParam: HydratedDocument<ITempUser> | string,
) {
  if (typeof tempUserParam === 'string') {
    const tempUser = await TempUser.findById(tempUserParam).exec();
    if (tempUser === null) {
      throw Error('TempUser not found');
    }
    return tempUser;
  } else {
    return tempUserParam;
  }
}

function createTempUser(email: string, hashedPassword: string) {
  return TempUser.create({
    email,
    password: hashedPassword,
    expDate: new Date(Date.now() + TEMP_USER_MAX_AGE),
  });
}

async function getTempUserVerificationToken(
  tempUser: string | HydratedDocument<ITempUser>,
) {
  const userToCheck = await _getTempUserFromParam(tempUser);

  return userToCheck.verificationToken;
}

function getTempUserFromToken(verificationToken: string) {
  return TempUser.findOne({ verificationToken }).exec();
}

async function checkIfTempUserExpired(
  tempUser: string | HydratedDocument<ITempUser>,
) {
  const userToCheck = await _getTempUserFromParam(tempUser);

  const isExpired = userToCheck.expDate < new Date();
  return isExpired;
}

function getUserByEmail(email: string) {
  return TempUser.findOne({ email }).exec();
}

function getUserId(user: { _id: Types.ObjectId }) {
  return user._id;
}

export {
  createTempUser,
  getTempUserVerificationToken,
  getTempUserFromToken,
  getUserByEmail,
  checkIfTempUserExpired,
  getUserId,
};
