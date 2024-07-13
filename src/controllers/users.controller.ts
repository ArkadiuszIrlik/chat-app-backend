import jwt from 'jsonwebtoken';
import User, { IUser } from '@models/User.js';
import { Request, Response } from 'express';
import * as usersService from '@services/users.service.js';

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

  return res.json({
    _id: user._id,
    name: user.username,
    profileImg: user.profileImg,
    serversIn: user.serversIn,
    prefersOnlineStatus: user.prefersOnlineStatus,
  });
}

}
