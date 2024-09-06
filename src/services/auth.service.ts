import {
  AUTH_JWT_MAX_AGE,
  REFRESH_TOKEN_LOCK_TTL,
  REFRESH_TOKEN_MAX_AGE,
} from '@config/auth.config.js';
import { IRefreshTokenObject, IUser } from '@models/User.js';
import argon2 from 'argon2';
import { Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose, { HydratedDocument } from 'mongoose';
import * as usersService from '@services/users.service.js';
import NodeCache from 'node-cache';

async function hashPassword(password: string) {
  if (!process.env.PASSWORD_PEPPER) {
    console.error('Missing PASSWORD_PEPPER environment variable');
    throw Error('Server error');
  }
  const hashedPassword = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
    secret: Buffer.from(process.env.PASSWORD_PEPPER),
  });

  return hashedPassword;
}

function verifyPasswordMatch(hashedPassword: string, plainPassword: string) {
  if (!process.env.PASSWORD_PEPPER) {
    console.error('PASSWORD_PEPPER env variable missing');
    throw Error('Server error');
  }

  return argon2.verify(hashedPassword, plainPassword, {
    secret: Buffer.from(process.env.PASSWORD_PEPPER),
  });
}

function signAuthJwt(userId: mongoose.Types.ObjectId | string, email: string) {
  return new Promise<string>((resolve, reject) => {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable missing');
      return reject('Server error');
    }
    jwt.sign(
      { userId },
      process.env.JWT_SECRET,
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

function generateRefreshTokenObject() {
  const token = crypto.randomUUID();
  const refreshTokenObj: IRefreshTokenObject = {
    token,
    expDate: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE),
  };

  return refreshTokenObj;
}

function getTokenFromRefreshTokenObject(
  refreshTokenObject: IRefreshTokenObject,
) {
  return refreshTokenObject.token;
}

function logOutUser(res: Response) {
  return res.clearCookie('auth').clearCookie('refresh');
}

/** Sets both "auth" and "refresh" cookie on response object.
 *
 * Use this when res.cookie method isn't available, e.g. when working with Socket.IO middleware.
 */
function setAuthCookies(
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

function checkIsValidRefreshToken(
  token: string,
  user: HydratedDocument<IUser>,
) {
  const userTokenObjects = usersService.getUserRefreshTokens(user);
  const isRefreshValid = !!userTokenObjects.find(
    (obj) => obj.token === token && obj.expDate >= new Date(),
  );

  return isRefreshValid;
}

function _isPlainObject(obj: unknown): obj is Record<PropertyKey, unknown> {
  return typeof obj === 'object' && !Array.isArray(obj) && obj !== null;
}
/** TypeScript type guard that checks if an object fulfills the
 * AuthTokenPayload interface. */
function _isAuthTokenPayload(value: unknown): value is AuthTokenPayload {
  if (!_isPlainObject(value)) return false;

  const { exp, sub, userId } = value;

  if (typeof exp !== 'number') return false;
  if (typeof sub !== 'string') return false;
  if (typeof userId !== 'string') return false;

  const obj = { exp, sub, userId };
  // @ts-expect-error: turn off "obj is declared but never used."
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const isValid: AuthTokenPayload = obj;

  return true;
}

interface AuthTokenPayload {
  exp: number;
  sub: string;
  userId: string;
}

async function decodeAuthToken(token: string) {
  const decodedToken = await new Promise<AuthTokenPayload>(
    (resolve, reject) => {
      if (!process.env.JWT_SECRET) {
        console.error('Missing JWT_SECRET environment variable');
        return reject(new Error('Server error'));
      }
      jwt.verify(
        token,
        process.env.JWT_SECRET,
        { ignoreExpiration: true },
        (err, decoded) => {
          if (err) {
            return reject(err);
          }
          if (_isAuthTokenPayload(decoded)) {
            return resolve(decoded);
          } else {
            return reject(new Error('Invalid payload format'));
          }
        },
      );
    },
  );

  return decodedToken;
}

let refreshLockCache: NodeCache;

function initializeRefreshLockCache() {
  refreshLockCache = new NodeCache({ stdTTL: REFRESH_TOKEN_LOCK_TTL });
}

function addRefreshLock(refreshToken: string) {
  if (!refreshLockCache) {
    console.error('Refresh token lock cache not found');
    throw new Error('Refresh token lock cache not found');
  }
  return refreshLockCache.set(refreshToken, true);
}

function checkRefreshTokenHasLock(refreshToken: string) {
  if (!refreshLockCache) {
    console.error('Refresh token lock cache not found');
    throw new Error('Refresh token lock cache not found');
  }
  return refreshLockCache.has(refreshToken);
}

export {
  hashPassword,
  verifyPasswordMatch,
  signAuthJwt,
  generateRefreshTokenObject,
  getTokenFromRefreshTokenObject,
  logOutUser,
  setAuthCookies,
  checkIsValidRefreshToken,
  AuthTokenPayload,
  decodeAuthToken,
  initializeRefreshLockCache,
  addRefreshLock,
  checkRefreshTokenHasLock,
};
