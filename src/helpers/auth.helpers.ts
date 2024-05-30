import jwt from 'jsonwebtoken';
import {
  AUTH_JWT_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
} from '@config/auth.config.js';
import { Response } from 'express';
import { IUser } from '@models/User.js';

export function signAuthJwt(email: string) {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(
      {},
      process.env.JWT_SECRET!,
      {
        expiresIn: `${AUTH_JWT_MAX_AGE}ms`,
        subject: email,
      },
      (err, encoded) => {
        if (err) {
          return reject(err);
        } else {
          resolve(encoded!);
        }
      },
    );
  });
}

export function setAuthCookie(res: Response, authToken: string) {
  res.cookie('auth', authToken, {
    // auth cookie should stay alive longer than the actual
    // JWT stays valid. This allows the app to use the "subject"
    // claim to match the refresh token with the correct user
    // in the DB
    maxAge: REFRESH_TOKEN_MAX_AGE,
    secure: true,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  });
}

export function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie('refresh', refreshToken, {
    maxAge: REFRESH_TOKEN_MAX_AGE,
    secure: true,
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
  });
}

/** Sets both "auth" and "refresh" cookie on response object.
 *
 * Use this when res.cookie method isn't available, e.g. when working with Socket.IO middleware.
 */

export function setAuthCookies(
  res: Response,
  authToken: string,
  refreshToken: string,
) {
  const cookieParams = `Max-Age=${
    REFRESH_TOKEN_MAX_AGE / 1000
  }; Path=/; Expires=${new Date(
    Date.now() + REFRESH_TOKEN_MAX_AGE,
  ).toUTCString()}; HttpOnly; Secure; SameSite=Lax`;
  res.setHeader('Set-Cookie', [
    `auth=${authToken}; ${cookieParams}`,
    `refresh=${refreshToken}; ${cookieParams}`,
  ]);
}

/** Adds a new refresh token to the provided DB user and returns the generated
 * token object.
 */
export async function generateRefreshToken(userDoc: IUser) {
  const token = crypto.randomUUID();
  const refreshTokenObj: IUser['refreshTokens'][number] = {
    token,
    expDate: new Date(new Date().getTime() + REFRESH_TOKEN_MAX_AGE),
  };

  userDoc.refreshTokens.push(refreshTokenObj);
  try {
    await userDoc.save();
    return refreshTokenObj;
  } catch (err) {
    throw err;
  }
}

export function getEmailFromJwt(token: string) {
  const decoded = jwt.decode(token);

  return decoded?.sub ?? '';
}
