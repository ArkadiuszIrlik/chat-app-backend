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
        if (new Date(Number(decoded.exp) * 1000) < new Date()) {
          if (req.cookies.refresh) {
            const user: IUser = await User.findOne({
              email: decoded.sub,
            }).exec();
            const isRefreshValid = !!user.refreshTokens.find(
              (el) => el.token === req.cookies.refresh,
            );
            if (isRefreshValid) {
              // renew refresh token
              user.refreshTokens = user.refreshTokens.filter(
                (el) => el.token !== req.cookies.refresh,
              );
              const { token: nextRefreshToken } =
                await generateRefreshToken(user);

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
