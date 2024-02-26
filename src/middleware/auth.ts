import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '@models/User.js';
import {
  generateRefreshToken,
  setAuthCookie,
  setRefreshCookie,
  signAuthJwt,
} from '@helpers/auth.helpers.js';

function denyAccess(res: Response) {
  return res
    .clearCookie('auth')
    .clearCookie('refresh')
    .status(401)
    .json({ message: 'Missing valid client credentials' });
}

export default async function checkAuthExpiry(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (req.cookies.auth === undefined) {
    return denyAccess(res);
  }
  if (req.cookies.auth) {
    jwt.verify(
      req.cookies.auth,
      process.env.JWT_SECRET!,
      { ignoreExpiration: true },
      async (err, decoded) => {
        if (err) {
          console.log(typeof err);
          console.log(err);
          console.log(JSON.stringify(err));
          return next(err);
        }
        if (
          typeof decoded === 'string' ||
          decoded === undefined ||
          decoded.exp === undefined ||
          decoded.sub === undefined
        ) {
          return denyAccess(res);
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
              setRefreshCookie(res, nextRefreshToken);

              // renew auth JWT
              const encodedJwt = await signAuthJwt(user.email);
              setAuthCookie(res, encodedJwt);

              return next();
            } else {
              return denyAccess(res);
            }
          } else {
            return denyAccess(res);
          }
        }
        return next();
      },
    );
  }
  if (req.cookies.auth === '') {
    return denyAccess(res);
  }
}
