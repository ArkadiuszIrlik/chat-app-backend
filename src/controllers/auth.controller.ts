import { NextFunction, Request, Response } from 'express';
import argon2 from 'argon2';
import User, { IUser } from '@models/User.js';
import {
  generateRefreshToken,
  setAuthCookie,
  setRefreshCookie,
  signAuthJwt,
} from '@helpers/auth.helpers.js';
import { sendVerificationMail } from '@helpers/mail.helpers.js';
import TempUser from '@models/TempUser.js';
import {
  CLIENT_RESET_PASSWORD_URL,
  TEMP_USER_MAX_AGE,
} from '@config/auth.config.js';
import { getUserTrackingInfo } from '@helpers/tracking.helpers.js';
import { CLIENT_EMAIL_VERIFICATION_URL } from '@config/mail.config.js';

export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password } = req.body;

    const existingEmail = User.findOne({ email }).exec();

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      secret: Buffer.from(process.env.PASSWORD_PEPPER!),
    });

    const isExistingEmail = !!(await existingEmail);

    if (!isExistingEmail) {
      const verificationToken = crypto.randomUUID();
      await TempUser.create({
        email,
        password: hashedPassword,
        expDate: new Date(Date.now() + TEMP_USER_MAX_AGE),
        verificationToken,
      });
      await sendVerificationMail(email, isExistingEmail, {
        verificationUrl:
          CLIENT_EMAIL_VERIFICATION_URL + `?token=${verificationToken}`,
      });
    } else {
      const userLocationInfo = await getUserTrackingInfo(req);
      await sendVerificationMail(email, isExistingEmail, {
        resetPasswordUrl: CLIENT_RESET_PASSWORD_URL,
        ...userLocationInfo,
      });
    }

    return res.status(200).json({
      message: 'Confirmation email sent to provided address',
    });
  } catch (err) {
    return next(err);
  }
}

export async function logInUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password } = req.body;
    const user: IUser = await User.findOne({ email }).exec();

    // prevent timing attacks when user not found
    if (!user) {
      const placeholderPassword =
        '$argon2id$v=19$m=19456,t=2,p=1$a0Ssm0ypgf6Tb5TU5usH0A$wvwQMNUX1kOasnZdXgkrpaOivDCzCdOR3ervvKya4JI';
      await argon2.verify(placeholderPassword, password);
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const passwordMatch = await argon2.verify(user.password, password, {
      secret: Buffer.from(process.env.PASSWORD_PEPPER!),
    });

    if (!passwordMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    const token = await signAuthJwt(user.email);
    setAuthCookie(res, token);

    const { token: refreshToken } = await generateRefreshToken(user);
    setRefreshCookie(res, refreshToken);

    return res.status(200).json({
      message: 'Logged in successfully',
    });
  } catch (err) {
    return next(err);
  }
}

export async function logOutUser(
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  return res
    .clearCookie('auth')
    .clearCookie('refresh')
    .json({ message: 'Logged out successfully' });
}
