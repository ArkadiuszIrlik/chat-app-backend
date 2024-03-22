import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '@models/User.js';
import {
  generateRefreshToken,
  setAuthCookies,
  signAuthJwt,
} from '@helpers/auth.helpers.js';

interface RequestWithSockets extends Request {
  isSocketRequest?: boolean;
  _query?: Record<string, any>;
}

function denyAccess(
  req: RequestWithSockets,
  res: Response,
  next: NextFunction,
) {
  function clearCookie(res: Response, names: string | string[]) {
    let cookieNames: string[];
    if (typeof names === 'string') {
      cookieNames = [names];
    } else {
      cookieNames = names;
    }
    res.setHeader(
      'Set-Cookie',
      cookieNames.map(
        (name) => `${name}=; Path=/; Expires=${new Date(0).toUTCString()}`,
      ),
    );
  }

  clearCookie(res, ['auth', 'refresh']);

  if (req.isSocketRequest) {
    return next();
  }

  return res
    .setHeader('WWW-Authenticate', 'cookie-token')
    .status(401)
    .json({ message: 'Missing valid client credentials' });
}

/** Expires provided refresh token, removes expired tokens from DB and
 *  generates and returns a new refresh token object.  */

async function renewRefreshToken(user: IUser, currentToken: string) {
  user.refreshTokens = user.refreshTokens.reduce<IUser['refreshTokens']>(
    (arr, el: IUser['refreshTokens'][number]) => {
      if (el.expDate < new Date()) {
        return arr;
      }
      if (el.token === currentToken) {
        // Instead of removing the current token outright, its expiry is
        // changed to 10 seconds from now. This is done in case multiple
        // requests are sent at the same time and client hasn't received
        // the new token yet. This prevents the extra requests from being
        // denied access.
        el.expDate = new Date(Date.now() + 10000);
      }
      arr.push(el);
      return arr;
    },
    [],
  );

  return generateRefreshToken(user);
}

export default async function checkAuthExpiry(
  req: RequestWithSockets,
  res: Response,
  next: NextFunction,
) {
  if (req.cookies.auth === undefined) {
    return denyAccess(req, res, next);
  }
  if (req.cookies.auth) {
    jwt.verify(
      req.cookies.auth,
      process.env.JWT_SECRET!,
      { ignoreExpiration: true },
      async (err, decoded) => {
        if (err) {
          console.error(err.message);
          return denyAccess(req, res, next);
        }
        if (
          typeof decoded === 'string' ||
          decoded === undefined ||
          decoded.exp === undefined ||
          decoded.sub === undefined
        ) {
          return denyAccess(req, res, next);
        }
        const isAuthTokenExpired =
          new Date(Number(decoded.exp) * 1000) < new Date();
        if (isAuthTokenExpired) {
          if (req.cookies.refresh) {
            const user: IUser = await User.findOne({
              email: decoded.sub,
            }).exec();
            const isRefreshValid = !!user.refreshTokens.find(
              (el) =>
                el.token === req.cookies.refresh && el.expDate >= new Date(),
            );
            if (isRefreshValid) {
              // renew refresh token
              const { token: nextRefreshToken } = await renewRefreshToken(
                user,
                req.cookies.refresh,
              );

              // renew auth JWT
              const encodedJwt = await signAuthJwt(user.email);

              setAuthCookies(res, encodedJwt, nextRefreshToken);

              if (req.isSocketRequest) {
                req.user = user;
              }

              return next();
            } else {
              return denyAccess(req, res, next);
            }
          } else {
            return denyAccess(req, res, next);
          }
        }
        if (req.isSocketRequest) {
          const user: IUser = await User.findOne({
            email: decoded.sub,
          }).exec();
          req.user = user;
        }
        return next();
      },
    );
  }
  if (req.cookies.auth === '') {
    return denyAccess(req, res, next);
  }
}

export function verifySocketAuth(
  req: RequestWithSockets,
  res: Response,
  next: NextFunction,
) {
  const isHandshake = req._query?.sid === undefined;
  if (!isHandshake) {
    return next();
  }
  req.isSocketRequest = true;
  return checkAuthExpiry(req, res, next);
}
