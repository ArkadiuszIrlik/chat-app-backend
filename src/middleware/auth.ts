import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '@models/User.js';
import AUTH_JWT_MAX_AGE, {
  REFRESH_TOKEN_MAX_AGE,
} from '@config/auth.config.js';

function denyAccess(res: Response) {
  return res.clearCookie('auth').clearCookie('refresh').redirect('/login');
}

function signAuthJwt(email: string) {
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
              const nextRefreshToken = crypto.randomUUID();
              const nextRefreshObj: IUser['refreshTokens'][number] = {
                token: nextRefreshToken,
                expDate: new Date(new Date().getTime() + REFRESH_TOKEN_MAX_AGE),
              };
              user.refreshTokens = user.refreshTokens.filter(
                (el) => el.token !== req.cookies.refresh,
              );
              user.refreshTokens.push(nextRefreshObj);
              await user.save();

              res.cookie('refresh', nextRefreshToken, {
                maxAge: REFRESH_TOKEN_MAX_AGE,
              });

              // renew auth JWT
              const encodedJwt = await signAuthJwt(user.email);
              // auth cookie should stay alive longer than the actual
              // JWT stays valid. This allows the app to use the "subject"
              // claim to match the refresh token with the correct user
              // in the DB
              res.cookie('auth', encodedJwt, {
                maxAge: REFRESH_TOKEN_MAX_AGE,
              });

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
