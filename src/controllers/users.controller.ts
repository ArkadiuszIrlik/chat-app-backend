import { Request, Response, NextFunction } from 'express';
import * as usersService from '@services/users.service.js';
import * as socketService from '@services/socket.service.js';
import { UserAccountStatus } from '@models/User.js';
import createHttpError from 'http-errors';

export async function getUserFromAuth(req: Request, res: Response) {
  const accessingUserId = req.decodedAuth?.userId;
  if (!accessingUserId) {
    return res.status(401).json({ message: 'Missing user credentials' });
  }
  const user = await usersService.getUser(accessingUserId, {
    populateServersIn: true,
  });
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res
    .status(200)
    .json(
      usersService.getClientSafeSubset(user, usersService.UserAuthLevel.Self),
    );
}

export async function updateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = req.params.userId;
  const patch = req.body.patch;

  const user =
    req.context.requestedUser ?? (await usersService.getUser(userId));
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  try {
    await usersService.patchUser(user, patch);
  } catch (err) {
    return next(
      createHttpError(500, `Failed to update user`, { expose: true }),
    );
  }

  const userSocketRooms = await socketService.getRoomsUserIsIn(
    req.socketIo,
    userId,
  );
  socketService.emitUserUpdated(
    req.socketIo,
    userSocketRooms,
    usersService.getClientSafeSubset(
      user,
      usersService.UserAuthLevel.OtherUser,
    ),
  );

  return res.status(200).json({ message: 'User updated' });
}

export async function approveAccountStatus(req: Request, res: Response) {
  const userId = req.params.userId;
  const { username, profileImg } = req.body;

  const user =
    req.context.requestedUser ?? (await usersService.getUser(userId));
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  usersService.updateUser(user, { username, profileImg });
  usersService.verifyUserStatus(user);
  const newStatus = usersService.getUserAccountStatus(user);
  if (newStatus !== UserAccountStatus.Approved) {
    return res.status(404).json({ message: 'Failed to approve account' });
  }

  await usersService.saveUser(user);

  return res
    .status(200)
    .json({ message: 'Account approved', data: { accountStatus: newStatus } });
}
