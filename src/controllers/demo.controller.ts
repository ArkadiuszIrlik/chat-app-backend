import { Request, Response } from 'express';
import * as usersService from '@services/users.service.js';
import * as authService from '@services/auth.service.js';
import * as demoService from '@services/demo.service.js';
import { Types } from 'mongoose';

async function startDemo(_req: Request, res: Response) {
  const userId = new Types.ObjectId();
  const demoServer = demoService.createDemoServer(userId);
  const user = await demoService.createDemoUser(userId, demoServer._id);

  // AUTH
  const deviceId = usersService.generateDeviceId();
  const authToken = await authService.signAuthJwt(userId, user.email, deviceId);
  authService.setAuthCookie(res, authToken);

  const refreshTokenObject = authService.generateRefreshTokenObject(deviceId);
  await usersService.addRefreshToken(user, refreshTokenObject, {
    saveDocument: false,
  });
  const refreshToken =
    authService.getTokenFromRefreshTokenObject(refreshTokenObject);
  authService.setRefreshCookie(res, refreshToken);
  // _AUTH

  await Promise.all([user.save(), demoServer.save()]);
  //@ts-expect-error Mongoose subdocument types on channelCategories
  await demoService.addInitialServerMessages(demoServer);

  return res.status(200).json({ message: 'Logged into demo account' });
}

export { startDemo };
