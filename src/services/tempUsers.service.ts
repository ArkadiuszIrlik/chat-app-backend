import { TEMP_USER_MAX_AGE } from '@config/auth.config.js';
import TempUser, { ITempUser } from '@models/TempUser.js';
import { HydratedDocument } from 'mongoose';

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

export { createTempUser, getTempUserVerificationToken };
