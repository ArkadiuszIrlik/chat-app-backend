import jwt from 'jsonwebtoken';
import User, { IUser } from '@models/User.js';
import { Request, Response } from 'express';

export async function getUserFromAuth(req: Request, res: Response) {
  const decoded = jwt.decode(req.cookies.auth)!;
  const user: IUser = await User.findOne({ email: decoded.sub }).exec();

  return res.json({
    _id: user._id,
    name: user.username,
    profileImg: user.profileImg,
  });
}
