import { getEmailFromJwt } from '@helpers/auth.helpers.js';
import ChatMessage from '@models/ChatMessage.js';
import User from '@models/User.js';
import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';

export async function getMessages(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const chatId = req.params.chatId;
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    const err = new Error('Invalid param');
    err.status = 404;
    return next(err);
  }

  const email = req.decodedAuth?.email || getEmailFromJwt(req.cookies.auth);
  const user = await User.findOne({ email }).exec();

  if (user === null) {
    return res.status(404).json({ message: 'User not found' });
  }

  const messages = await ChatMessage.find({ chatId })
    .sort({ postedAt: -1 })
    .limit(20)
    .populate('author', 'username profileImg')
    .exec();

  // No messages found
  if (messages.length === 0) {
    return res.status(404).json({ message: 'Messages not found' });
  }

  const isServerMessage = !!messages[0].get('serverId');
  if (isServerMessage) {
    const serverId = messages[0].serverId;
    const isUserInServer = !!user?.serversIn.find((id) => id.equals(serverId));

    if (!isUserInServer) {
      return res
        .status(403)
        .json({ message: 'Unauthorized to access messages' });
    }

    return res
      .status(200)
      .json({ message: 'Messages returned', data: { messages } });
  } else {
    return res.status(404).json({ message: 'Invalid message format' });
  }
}
