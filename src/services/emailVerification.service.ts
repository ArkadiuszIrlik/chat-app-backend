import { VERIFICATION_MAIL_MAX_AGE } from '@config/auth.config.js';
import EmailVerification from '@models/EmailVerification.js';
import { Types } from 'mongoose';

function generateVerificationToken(
  userId: Types.ObjectId,
  email: string,
  expDate?: Date,
) {
  const verificationToken = crypto.randomUUID();
  EmailVerification.create({
    userId,
    email,
    token: verificationToken,
    expDate,
  });

  return verificationToken;
}

function generateVerificationTokenObject(email: string, expDate?: Date) {
  const verificationToken = crypto.randomUUID();
  const nextExpDate = expDate
    ? expDate
    : new Date(Date.now() + VERIFICATION_MAIL_MAX_AGE);
  const tokenObject = {
    email,
    token: verificationToken,
    expDate: nextExpDate,
  };

  return tokenObject;
}

export { generateVerificationToken, generateVerificationTokenObject };
