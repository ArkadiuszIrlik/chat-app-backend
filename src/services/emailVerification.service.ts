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

export { generateVerificationToken };
