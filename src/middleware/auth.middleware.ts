import { NextFunction, Request, Response } from 'express';
import { IUser } from '@models/User.js';
import { HydratedDocument } from 'mongoose';
import * as authService from '@services/auth.service.js';
import * as usersService from '@services/users.service.js';

/** A function meant to mimic the functionality of res.clearCookie method
 * for SocketIo response objects which can't use it. */
function _clearCookie(res: Response, names: string | string[]) {
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

function _denyAccess(req: Request, res: Response, next: NextFunction) {
  if (req.context.isSocketRequest) {
    _clearCookie(res, ['auth', 'refresh']);
    return next();
  } else {
    return res
      .clearCookie('auth')
      .clearCookie('refresh')
      .setHeader('WWW-Authenticate', 'cookie-token')
      .status(401)
      .json({ message: 'Missing valid client credentials' });
  }
}

/** Expires provided refresh token, removes expired tokens from DB and
 *  generates and returns a new refresh token object.  */
async function _renewRefreshToken(
  user: HydratedDocument<IUser>,
  currentToken: string,
) {
  const refreshTokens = usersService.getUserRefreshTokens(user);
  const nextRefreshTokens = refreshTokens.reduce<IUser['refreshTokens']>(
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
        el.expDate = new Date(Date.now() + 10 * 1000);
      }
      arr.push(el);
      return arr;
    },
    [],
  );

  await usersService.setUserRefreshTokens(user, nextRefreshTokens, {
    saveDocument: false,
  });

  const nextTokenObject = authService.generateRefreshTokenObject();
  await usersService.addRefreshToken(user, nextTokenObject, {
    saveDocument: false,
  });
  return nextTokenObject;
}

async function verifyAuth(req: Request, res: Response, next: NextFunction) {
  // req.cookies.auth could probably be replaced with
  // const authToken = authService.getAuthToken(req)
  const authToken = req.cookies.auth;
  if (!authToken) {
    return _denyAccess(req, res, next);
  }
  const decodedAuthToken = await authService.decodeAuthToken(authToken);
  const isAuthTokenExpired =
    new Date(Number(decodedAuthToken.exp) * 1000) < new Date();
  if (!isAuthTokenExpired) {
    req.decodedAuth = {
      userId: decodedAuthToken.userId,
      email: decodedAuthToken.sub,
    };
    return next();
  }

  const refreshToken = req.cookies.refresh;
  if (!refreshToken) {
    return _denyAccess(req, res, next);
  }
  const user = await usersService.getUserByEmail(decodedAuthToken.sub);
  // DENY ACCESS
  if (!user) {
    return _denyAccess(req, res, next);
  }
  const isRefreshValid = authService.checkIsValidRefreshToken(
    refreshToken,
    user,
  );
  if (!isRefreshValid) {
    return _denyAccess(req, res, next);
  }
  // renew refresh token
  const nextTokenObject = await _renewRefreshToken(user, refreshToken);
  const nextRefreshToken =
    authService.getTokenFromRefreshTokenObject(nextTokenObject);

  // renew auth JWT
  const userId = usersService.getUserId(user);
  const userEmail = await usersService.getUserEmail(user);
  const encodedJwt = await authService.signAuthJwt(userId, userEmail);

  authService.setAuthCookies(res, encodedJwt, nextRefreshToken);

  req.context.requestingUser = user;
  req.decodedAuth = {
    userId: userId.toString(),
    email: userEmail,
  };
  return next();
}

async function addRequestingUserToContext(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (req.context.requestingUser) {
    return next();
  }
  const userId = req.decodedAuth?.userId;
  if (!userId) {
    console.error('Missing decodedAuth.userId');
    throw new Error('Missing decodedAuth.userId');
  }
  const user = await usersService.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }
  req.context.requestingUser = user;
  return next();
}

export { verifyAuth, addRequestingUserToContext };
