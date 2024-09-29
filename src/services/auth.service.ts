import {
  AUTH_JWT_MAX_AGE,
  REFRESH_TOKEN_LOCK_TTL,
  REFRESH_TOKEN_MAX_AGE,
} from '@config/auth.config.js';
import { IRefreshTokenObject, IUser } from '@models/User.js';
import argon2 from 'argon2';
import { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import mongoose, { HydratedDocument } from 'mongoose';
import * as usersService from '@services/users.service.js';
import NodeCache from 'node-cache';
import cookie from 'cookie';

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

const authCookieOptions: CookieOptions = {
  // auth cookie should stay alive longer than the actual
  // JWT stays valid. This allows the app to use the "subject"
  // claim to match the refresh token with the correct user
  // in the DB
  maxAge: REFRESH_TOKEN_MAX_AGE, // ms
  secure: true,
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
};

const refreshCookieOptions: CookieOptions = {
  maxAge: REFRESH_TOKEN_MAX_AGE, // ms
  secure: true,
  path: '/',
  httpOnly: true,
  sameSite: 'lax',
};

function setAuthCookie(res: Response, authToken: string) {
  return res.cookie('auth', authToken, authCookieOptions);
}

function setRefreshCookie(res: Response, refreshToken: string) {
  return res.cookie('refresh', refreshToken, refreshCookieOptions);
}

/** Sets both "auth" and "refresh" cookie on response object. This will overwrite the
 * current value of the 'Set-Cookie' response header.
 *
 * Use this when res.cookie method isn't available, e.g. when working with Socket.IO middleware.
 */
function setAuthRefreshCookies(
  res: Response,
  authToken: string,
  refreshToken: string,
) {
  // HTTP cookie expects maxAge to be given in seconds, while
  // express res.cookie maxAge option uses miliseconds
  const fixedAuthOptions = { ...authCookieOptions };
  if (fixedAuthOptions.maxAge) {
    fixedAuthOptions.maxAge /= 1000;
  }
  const fixedRefreshOptions = { ...refreshCookieOptions };
  if (fixedRefreshOptions.maxAge) {
    fixedRefreshOptions.maxAge /= 1000;
  }
  return res.setHeader('Set-Cookie', [
    cookie.serialize('auth', authToken, fixedAuthOptions),
    cookie.serialize('refresh', refreshToken, fixedRefreshOptions),
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
  sub: string; //email
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

/** Expires provided currentToken and generates and returns new
 * refresh token object. */
async function renewRefreshToken(
  currentToken: string,
  user: HydratedDocument<IUser>,
  { saveDocument = false }: { saveDocument?: boolean } = {},
) {
  usersService.removeRefreshToken(user, currentToken);
  const nextTokenObject = generateRefreshTokenObject();
  await usersService.addRefreshToken(user, nextTokenObject, {
    saveDocument,
  });

  return nextTokenObject;
}

export {
  hashPassword,
  verifyPasswordMatch,
  signAuthJwt,
  generateRefreshTokenObject,
  getTokenFromRefreshTokenObject,
  logOutUser,
  setAuthCookie,
  setRefreshCookie,
  setAuthRefreshCookies,
  checkIsValidRefreshToken,
  AuthTokenPayload,
  decodeAuthToken,
  initializeRefreshLockCache,
  addRefreshLock,
  checkRefreshTokenHasLock,
  renewRefreshToken,
};
