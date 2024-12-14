import { TEMP_USER_MAX_AGE } from '@config/auth.config.js';
import { IEmailVerification } from '@models/EmailVerificationToken.js';
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

function refreshUserExpDate(user: Pick<ITempUser, 'expDate'>, expDate?: Date) {
  if (expDate) {
    user.expDate = expDate;
  } else {
    user.expDate = new Date(Date.now() + TEMP_USER_MAX_AGE);
  }

  return user;
}

function addEmailVerificationToken(
  user: Pick<ITempUser, 'emailVerificationTokens'>,
  token: IEmailVerification['token'],
  nextEmail: string,
  expDate?: Date,
) {
  const tokenObject = {
    token,
    email: nextEmail,
    expDate,
  };
  // @ts-expect-error expDate has a default value in the schema
  user.emailVerificationTokens.push(tokenObject);

  return user;
}

function getUserByEmailToken(
  token: ITempUser['emailVerificationTokens'][number]['token'],
) {
  return TempUser.findOne({ 'emailVerificationTokens.token': token }).exec();
}

function addEmailVerificationTokenObject(
  user: Pick<ITempUser, 'emailVerificationTokens'>,
  tokenObject: IEmailVerification,
) {
  user.emailVerificationTokens.push(tokenObject);

  return user;
}

function getEmailVerificationTokenObject(
  user: Pick<ITempUser, 'emailVerificationTokens'>,
  token: IEmailVerification['token'],
) {
  return user.emailVerificationTokens.find((el) => el.token === token);
}

function removeEmailVerificationToken(
  user: Pick<ITempUser, 'emailVerificationTokens'>,
  token: IEmailVerification['token'],
) {
  user.emailVerificationTokens = user.emailVerificationTokens.filter(
    (el) => el.token !== token,
  );
  return user;
}

/** Returns array of removed token objects. */
function removeAllEmailVerificationTokens(
  user: Pick<ITempUser, 'emailVerificationTokens'>,
) {
  const removedTokens = user.emailVerificationTokens;
  user.emailVerificationTokens = [];

  return removedTokens;
}

export {
  createTempUser,
  getTempUserVerificationToken,
  getTempUserFromToken,
  getUserByEmail,
  getUserByEmailToken,
  checkIfTempUserExpired,
  getUserId,
  refreshUserExpDate,
  addEmailVerificationToken,
  addEmailVerificationTokenObject,
  getEmailVerificationTokenObject,
  removeEmailVerificationToken,
  removeAllEmailVerificationTokens,
};
