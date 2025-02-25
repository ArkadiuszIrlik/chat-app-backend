import { NextFunction, Request, Response } from 'express';
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

async function verifyAuth(req: Request, res: Response, next: NextFunction) {
  const authToken = req.cookies.auth;
  if (!authToken) {
    return _denyAccess(req, res, next);
  }
  let decodedAuthToken: authService.AuthTokenPayload;
  try {
    decodedAuthToken = await authService.decodeAuthToken(authToken);
  } catch {
    return _denyAccess(req, res, next);
  }
  const isAuthTokenExpired =
    new Date(Number(decodedAuthToken.exp) * 1000) < new Date();
  if (!isAuthTokenExpired) {
    req.decodedAuth = {
      userId: decodedAuthToken.userId,
      email: decodedAuthToken.sub,
      deviceId: decodedAuthToken.deviceId,
    };
    return next();
  }

  const refreshToken = req.cookies.refresh;
  if (!refreshToken) {
    return _denyAccess(req, res, next);
  }
  const user = await usersService.getUserByEmail(decodedAuthToken.sub);
  if (!user) {
    return _denyAccess(req, res, next);
  }

  const isRefreshLocked = authService.checkRefreshTokenHasLock(refreshToken);
  if (isRefreshLocked) {
    const userId = usersService.getUserId(user);
    const userEmail = await usersService.getUserEmail(user);
    req.context.requestingUser = user;
    req.decodedAuth = {
      userId: userId.toString(),
      email: userEmail,
      deviceId: decodedAuthToken.deviceId,
    };
    return next();
  }

  const isRefreshValid = authService.checkIsValidRefreshToken(
    refreshToken,
    user,
  );
  if (!isRefreshValid) {
    return _denyAccess(req, res, next);
  }
  authService.addRefreshLock(refreshToken);

  // renew refresh token
  const nextTokenObject = await authService.renewRefreshToken(
    refreshToken,
    user,
    decodedAuthToken.deviceId,
  );
  const nextRefreshToken =
    authService.getTokenFromRefreshTokenObject(nextTokenObject);

  // renew auth JWT
  const userId = usersService.getUserId(user);
  const userEmail = await usersService.getUserEmail(user);
  const encodedJwt = await authService.signAuthJwt(
    userId,
    userEmail,
    decodedAuthToken.deviceId,
  );

  await user.save();

  authService.setAuthRefreshCookies(res, encodedJwt, nextRefreshToken);

  req.context.requestingUser = user;
  req.decodedAuth = {
    userId: userId.toString(),
    email: userEmail,
    deviceId: decodedAuthToken.deviceId,
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
    return next();
  }
  const user = await usersService.getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }
  req.context.requestingUser = user;
  return next();
}

export { verifyAuth, addRequestingUserToContext };
