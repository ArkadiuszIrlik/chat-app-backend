import { NextFunction, Request, Response } from 'express';
import argon2 from 'argon2';
import User, { IUser } from '@models/User.js';
import {
  generateRefreshToken,
  setAuthCookie,
  setRefreshCookie,
  signAuthJwt,
} from '@helpers/auth.helpers.js';

export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { email, password } = req.body;

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      secret: Buffer.from(process.env.PASSWORD_PEPPER!),
    });

    await User.create({
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      message: 'User registered successfully',
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
