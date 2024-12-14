import { VERIFICATION_MAIL_MAX_AGE } from '@config/auth.config.js';
import { IEmailVerification } from '@models/EmailVerificationToken.js';

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

/** Returns true if token expired, false if not expired */
function checkTokenExpiry(tokenObject: IEmailVerification) {
  let isExpired: boolean;
  if (tokenObject.expDate < new Date()) {
    isExpired = true;
  } else {
    isExpired = false;
  }

  return isExpired;
}

export { generateVerificationTokenObject, checkTokenExpiry };
